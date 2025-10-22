<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SavingsLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id',
        'goal_id',
        //'user_id',
        'amount'
    ];
    
    // Relasi ke Goal
    public function goal()
    {
        return $this->belongsTo(Goal::class);
    }

    // Relasi ke Transaction
    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }
}
