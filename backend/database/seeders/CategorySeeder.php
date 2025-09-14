<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Salary', 'type' => 'income', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Freelance', 'type' => 'income', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Food', 'type' => 'expense', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Transport', 'type' => 'expense', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Entertainment', 'type' => 'expense', 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('categories')->insert($categories);
    }
}
