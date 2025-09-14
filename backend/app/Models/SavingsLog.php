<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
// App\Models\SavingsLog.php
class SavingsLog extends Model {
    
    protected $fillable = ['transaction_id', 'goal_id', 'amount'];

    public function goal() {
        return $this->belongsTo(Goal::class);
    }

    public function transaction() {
        return $this->belongsTo(Transaction::class);
    }
}
