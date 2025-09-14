<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TransactionSeeder extends Seeder
{
    public function run(): void
    {
        $transactions = [];

        for ($i = 1; $i <= 20; $i++) {
            $transactions[] = [
                'category_id' => rand(1, 5), // id categories 1–5
                'amount' => rand(50000, 5000000),
                'date' => Carbon::now()->subDays(rand(0, 30))->format('Y-m-d'),
                'note' => 'Dummy transaksi #' . $i,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('transactions')->insert($transactions);
    }
}
