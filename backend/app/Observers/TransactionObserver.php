<?php

// TransactionObserver.php
namespace App\Observers;

use App\Models\Transaction;
use App\Services\SavingAllocatorService;

class TransactionObserver
{
    protected $allocator;

    public function __construct(SavingAllocatorService $allocator)
    {
        $this->allocator = $allocator;
    }

    public function created(Transaction $transaction)
    {
        if ($transaction->category && $transaction->category->type === 'saving') {
            $this->allocator->allocate($transaction);
        }
    }
}
