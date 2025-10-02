<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Goal;
use App\Models\SavingsLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TransactionController extends Controller
{
    // ===========================
    // Ambil semua transaksi user
    // ===========================
    public function index()
    {
        try {
            $transactions = Transaction::with(['category', 'goal'])
                ->where('user_id', auth()->id())
                ->orderBy('date', 'desc')
                ->get();

            return response()->json($transactions);
        } catch (\Exception $e) {
            Log::error('Failed to fetch transactions', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to fetch transactions'], 500);
        }
    }

    // ===========================
    // Detail transaksi
    // ===========================
    public function show($id)
    {
        try {
            $transaction = Transaction::with(['category', 'goal'])
                ->where('user_id', auth()->id())
                ->findOrFail($id);

            return response()->json($transaction);
        } catch (\Exception $e) {
            Log::error('Transaction not found', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Transaction not found'], 404);
        }
    }

// ===========================
// Create transaksi baru
// ===========================
public function store(Request $request)
{
    $userId = auth()->id();
    if (!$userId) return response()->json(['message' => 'Unauthorized'], 401);

    try {
         Log::info('=== INCOMING REQUEST ===', [
            'raw_input' => $request->all(),
            'goal_id' => $request->goal_id,
            'category_id' => $request->category_id,
            'amount' => $request->amount
        ]);
        $validated = $request->validate([
            'date' => 'required|date',
            'category_id' => 'required|exists:categories,id',
            'amount' => 'required|numeric|min:0.01',
            'note' => 'nullable|string|max:255',
            'goal_id' => 'nullable|exists:goals,id'
        ]);
        Log::info('=== VALIDATED DATA ===', $validated);

        DB::beginTransaction();

        $transaction = Transaction::create([
            'user_id' => $userId,
            'date' => $validated['date'],
            'category_id' => (int)$validated['category_id'],
            'amount' => (float)$validated['amount'],
            'note' => $validated['note'] ?? null,
            'goal_id' => !empty($validated['goal_id']) ? (int)$validated['goal_id'] : null
        ]);
         Log::info('=== CREATED TRANSACTION ===', [
            'id' => $transaction->id,
            'goal_id' => $transaction->goal_id,
            'amount' => $transaction->amount
        ]);

        $transaction->load(['category', 'goal']);

        if ($transaction->goal_id && $transaction->category->type === 'saving') {
            $goal = Goal::lockForUpdate()->find($transaction->goal_id); //
            $goal = Goal::find($transaction->goal_id);
            $goal->refresh();
        if ($goal) {
            // Hitung sisa yang tersedia
            $available = $goal->target_amount - $goal->current_amount;

            // Validasi: gunakan >= untuk allow exact match
            if ($transaction->amount > $available) {
                DB::rollBack();
                return response()->json([
                    'message' => "Amount melebihi target goal, maksimum allowed: {$available}",
                    'debug' => [
                        'target_amount' => $goal->target_amount,
                        'current_amount' => $goal->current_amount,
                        'available' => $available,
                        'input_amount' => $transaction->amount
                    ]
                ], 422);
            }

            // Cek apakah akan melebihi target setelah ditambahkan
            $newTotal = $goal->current_amount + $transaction->amount;
            if ($newTotal > $goal->target_amount) {
                DB::rollBack();
                return response()->json([
                    'message' => "Total akan melebihi target. Maksimum allowed: {$available}"
                ], 422);
            }

            // update goal
            $goal->current_amount += $transaction->amount;
            $goal->save();

            // create savings log
            SavingsLog::create([
                'transaction_id' => $transaction->id,
                'goal_id' => $goal->id,
                'user_id' => $userId,
                'amount' => $transaction->amount,
            ]);
        }
}

        DB::commit();
        return response()->json($transaction, 201);

    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Transaction creation failed', ['error' => $e->getMessage()]);
        return response()->json(['message' => 'Failed to create transaction: ' . $e->getMessage()], 500);
    }
}

// ===========================
// Update transaksi
// ===========================
public function update(Request $request, $id)
{
    $userId = auth()->id();
    if (!$userId) return response()->json(['message' => 'Unauthorized'], 401);

    try {
        $transaction = Transaction::where('id', $id)
            ->where('user_id', $userId)
            ->with('category')
            ->firstOrFail();

        // Simpan nilai lama
        $oldAmount = $transaction->amount;
        $oldGoalId = $transaction->goal_id;
        $oldCategoryType = $transaction->category->type;

        $validated = $request->validate([
            'date' => 'required|date',
            'category_id' => 'required|exists:categories,id',
            'amount' => 'required|numeric|min:0.01',
            'note' => 'nullable|string|max:255',
            'goal_id' => 'nullable|exists:goals,id'
        ]);

        DB::beginTransaction();

        // STEP 1: Rollback old goal jika saving
        if ($oldGoalId && $oldCategoryType === 'saving') {
            $oldGoal = Goal::lockForUpdate()->find($oldGoalId);
            if ($oldGoal) {
                $oldGoal->current_amount -= $oldAmount;
                if ($oldGoal->current_amount < 0) $oldGoal->current_amount = 0;
                $oldGoal->save();

                SavingsLog::where('transaction_id', $transaction->id)->delete();
            }
        }

        // STEP 2: Update transaksi
        $transaction->update([
            'date' => $validated['date'],
            'category_id' => (int)$validated['category_id'],
            'amount' => (float)$validated['amount'],
            'note' => $validated['note'] ?? null,
            'goal_id' => !empty($validated['goal_id']) ? (int)$validated['goal_id'] : null
        ]);

        $transaction->load(['category', 'goal']);

        // STEP 3: Validasi & update goal BARU jika saving
        $newGoalId = $transaction->goal_id;
        $newCategoryType = $transaction->category->type;

        if ($newGoalId && $newCategoryType === 'saving') {
            $goal = Goal::lockForUpdate()->find($newGoalId);
            if ($goal) {
                // Hitung available berdasarkan current_amount yang sudah di-rollback
                $available = $goal->target_amount - $goal->current_amount;

                if ($transaction->amount > $available) {
                    DB::rollBack();
                    return response()->json([
                        'message' => "Amount melebihi target goal, maksimum allowed: {$available}",
                        'debug' => [
                            'target_amount' => $goal->target_amount,
                            'current_amount' => $goal->current_amount,
                            'available' => $available,
                            'input_amount' => $transaction->amount
                        ]
                    ], 422);
                }

                // Cek apakah akan melebihi target setelah ditambahkan
                $newTotal = $goal->current_amount + $transaction->amount;
                if ($newTotal > $goal->target_amount) {
                    DB::rollBack();
                    return response()->json([
                        'message' => "Total akan melebihi target. Maksimum allowed: {$available}"
                    ], 422);
                }

                $goal->current_amount += $transaction->amount;
                $goal->save();

                SavingsLog::create([
                    'transaction_id' => $transaction->id,
                    'goal_id' => $goal->id,
                    'user_id' => $userId,
                    'amount' => $transaction->amount,
                ]);
            }
        }

        DB::commit();
        return response()->json($transaction);

    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Transaction update failed', ['error' => $e->getMessage(), 'transaction_id' => $id]);
        return response()->json(['message' => 'Failed to update transaction: ' . $e->getMessage()], 500);
    }
}


// ===========================
// Delete transaksi
// ===========================
public function destroy($id)
{
    $userId = auth()->id();
    if (!$userId) return response()->json(['message' => 'Unauthorized'], 401);

    try {
        $transaction = Transaction::where('id', $id)
            ->where('user_id', $userId)
            ->firstOrFail();

        DB::beginTransaction();

        // rollback goal jika tipe saving
        if ($transaction->goal_id && $transaction->category->type === 'saving') {
            $goal = Goal::find($transaction->goal_id);
            if ($goal) {
                $goal->current_amount -= $transaction->amount;
                if ($goal->current_amount < 0) $goal->current_amount = 0;
                $goal->save();

                // hapus savings log terkait transaksi
                SavingsLog::where('transaction_id', $transaction->id)->delete();
            }
        }

        // hapus transaksi
        $transaction->delete();

        DB::commit();
        return response()->json(['message' => 'Transaction deleted successfully']);
    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Transaction deletion failed', ['error' => $e->getMessage(), 'transaction_id' => $id]);
        return response()->json(['message' => 'Failed to delete transaction: ' . $e->getMessage()], 500);
    }
}


    // ===========================
    // Summary 3 bulan terakhir
    // ===========================
    public function summary()
    {
        $userId = auth()->id();
        if (!$userId) return response()->json(['error' => 'Unauthorized'], 401);

        try {
            $data = DB::table('transactions')
                ->leftJoin('categories', 'transactions.category_id', '=', 'categories.id')
                ->select(
                    DB::raw("DATE_TRUNC('month', transactions.date) as month_date"),
                    DB::raw("TO_CHAR(DATE_TRUNC('month', transactions.date), 'Mon YYYY') as month"),
                    DB::raw("SUM(CASE WHEN categories.type = 'income' THEN transactions.amount ELSE 0 END) as income"),
                    DB::raw("SUM(CASE WHEN categories.type = 'expense' THEN transactions.amount ELSE 0 END) as expense")
                )
                ->where('transactions.user_id', $userId)
                ->whereNotNull('transactions.date')
                ->where('transactions.date', '>=', now()->subMonths(3)->startOfMonth())
                ->groupBy(DB::raw("DATE_TRUNC('month', transactions.date)"))
                ->orderBy('month_date', 'asc')
                ->get();

            return response()->json($data);
        } catch (\Exception $e) {
            Log::error('Summary fetch failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to fetch summary'], 500);
        }
    }

    // ===========================
    // Summary bulan ini
    // ===========================
    public function summaryCurrent()
    {
        $userId = auth()->id();
        if (!$userId) return response()->json(['error' => 'Unauthorized'], 401);

        try {
            $result = DB::table('transactions')
                ->leftJoin('categories', 'transactions.category_id', '=', 'categories.id')
                ->selectRaw("SUM(CASE WHEN categories.type = 'income' THEN transactions.amount ELSE 0 END) as income")
                ->selectRaw("SUM(CASE WHEN categories.type = 'expense' THEN transactions.amount ELSE 0 END) as expense")
                ->selectRaw("SUM(CASE WHEN categories.type = 'saving' THEN transactions.amount ELSE 0 END) as saving")
                ->where('transactions.user_id', $userId)
                ->whereRaw("DATE_TRUNC('month', transactions.date) = DATE_TRUNC('month', CURRENT_DATE)")
                ->first();

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Current summary fetch failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to fetch current summary'], 500);
        }
    }

    // ===========================
    // Insight pertumbuhan & top category
    // ===========================
    public function insight()
    {
        $userId = auth()->id();
        if (!$userId) return response()->json(['error' => 'Unauthorized'], 401);

        try {
            $currentMonth = DB::table('transactions')
                ->where('user_id', $userId)
                ->whereMonth('date', now()->month)
                ->whereYear('date', now()->year)
                ->selectRaw("SUM(amount) as total")
                ->first();

            $lastMonth = DB::table('transactions')
                ->where('user_id', $userId)
                ->whereMonth('date', now()->subMonth()->month)
                ->whereYear('date', now()->subMonth()->year)
                ->selectRaw("SUM(amount) as total")
                ->first();

            $growth = 0;
            if ($lastMonth->total > 0) {
                $growth = round((($currentMonth->total - $lastMonth->total) / $lastMonth->total) * 100);
            }

            $topCategory = DB::table('transactions')
                ->join('categories', 'transactions.category_id', '=', 'categories.id')
                ->where('transactions.user_id', $userId)
                ->whereMonth('transactions.date', now()->month)
                ->whereYear('transactions.date', now()->year)
                ->selectRaw('categories.name, SUM(transactions.amount) as total')
                ->groupBy('categories.name')
                ->orderByDesc('total')
                ->first();

            return response()->json([
                'growth' => $growth,
                'top_category' => $topCategory->name ?? null,
            ]);
        } catch (\Exception $e) {
            Log::error('Insight fetch failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to fetch insights'], 500);
        }
    }
}
