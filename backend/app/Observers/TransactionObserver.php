<?php

namespace App\Observers;

use App\Models\Transaction;
use App\Models\Goal;
use App\Models\SavingsLog;

class TransactionObserver
{
    /**
     * Trigger setelah transaksi baru dibuat
     */
    public function created(Transaction $transaction)
    {
        // cek apakah transaksi masuk kategori saving
        if ($transaction->category && $transaction->category->type === 'saving') {
            $remaining = $transaction->amount;

            // ambil semua goals sesuai prioritas (bisa ganti orderBy('priority') kalau ada kolom priority)
            $goals = Goal::orderBy('id')->get();

            foreach ($goals as $goal) {
                if ($remaining <= 0) break;

                $needed = $goal->target_amount - $goal->current_amount;
                if ($needed <= 0) continue;

                $allocate = min($remaining, $needed);

                // update current_amount di goals
                $goal->increment('current_amount', $allocate);

                // catat ke savings_logs
                SavingsLog::create([
                    'transaction_id' => $transaction->id,
                    'goal_id'        => $goal->id,
                    'amount'         => $allocate,
                ]);

                // kurangi sisa saving
                $remaining -= $allocate;
            }
        \Log::info("Observer jalan untuk transaksi ID: {$transaction->id}, amount: {$transaction->amount}");

        }
    }
}
