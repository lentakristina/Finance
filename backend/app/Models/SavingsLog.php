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
        'user_id',
        'amount'
    ];

    // In your SavingsLog model
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($savingsLog) {
            if (!$savingsLog->user_id) {
                $savingsLog->user_id = auth()->id();
            }
        });
    }
    
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
