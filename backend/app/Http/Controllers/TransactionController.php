<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Goal; // 👈 tambahin ini
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


class TransactionController extends Controller
{
    public function index()
    {
        return Transaction::with('category')->orderBy('date', 'desc')->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'amount' => 'required|numeric',
            'date' => 'required|date',
            'note' => 'nullable|string',
            'goal_id' => 'nullable|exists:goals,id', // 👈 tambahin ini
        ]);

        $transaction = Transaction::create($request->all());

        // Kalau transaksi saving dan ada goal_id → update goal
        $category = \DB::table('categories')->where('id', $request->category_id)->first();
        if ($category && $category->type === 'saving' && $request->goal_id) {
            \DB::table('goals')
                ->where('id', $request->goal_id)
                ->increment('current_amount', $request->amount);
        }

        return $transaction;
    }



    public function update(Request $request, $id)
    {
        $transaction = Transaction::findOrFail($id);
        $transaction->update($request->all());
        return $transaction;
    }

    public function destroy($id)
    {
        $deleted = Transaction::destroy($id);

        if ($deleted) {
            return response()->json(['message' => 'Transaction deleted successfully']);
        } else {
            return response()->json(['message' => 'Transaction not found'], 404);
        }
    }

public function summary()
{
    $data = \DB::table('transactions')
        ->selectRaw("TO_CHAR(date, 'Mon') as month")
        ->selectRaw("SUM(CASE WHEN categories.type = 'income' THEN amount ELSE 0 END) as income")
        ->selectRaw("SUM(CASE WHEN categories.type = 'expense' THEN amount ELSE 0 END) as expense")
        ->join('categories', 'transactions.category_id', '=', 'categories.id')
        ->where('date', '>=', now()->subMonths(3)->startOfMonth()) // 👈 hanya ambil 3 bulan terakhir
        ->groupBy('month', \DB::raw("DATE_TRUNC('month', date)"))
        ->orderBy(\DB::raw("DATE_TRUNC('month', date)"))
        ->get();

    return response()->json($data);
}

public function summaryCurrent()
{
    $result = \DB::table('transactions')
        ->join('categories', 'transactions.category_id', '=', 'categories.id')
        ->selectRaw("SUM(CASE WHEN categories.type = 'income' THEN amount ELSE 0 END) as income")
        ->selectRaw("SUM(CASE WHEN categories.type = 'expense' THEN amount ELSE 0 END) as expense")
        ->selectRaw("SUM(CASE WHEN categories.type = 'saving' THEN amount ELSE 0 END) as saving")
        ->whereRaw("DATE_TRUNC('month', transactions.date) = DATE_TRUNC('month', CURRENT_DATE)")
        ->first();

    return response()->json($result);
}

public function insight()
{
    $currentMonth = \DB::table('transactions')
        ->whereMonth('date', now()->month)
        ->whereYear('date', now()->year)
        ->selectRaw("SUM(amount) as total")
        ->first();

    $lastMonth = \DB::table('transactions')
        ->whereMonth('date', now()->subMonth()->month)
        ->whereYear('date', now()->subMonth()->year)
        ->selectRaw("SUM(amount) as total")
        ->first();

    $growth = 0;
    if ($lastMonth->total > 0) {
        $growth = round((($currentMonth->total - $lastMonth->total) / $lastMonth->total) * 100);
    }

    $topCategory = \DB::table('transactions')
        ->join('categories', 'transactions.category_id', '=', 'categories.id')
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
}

}
