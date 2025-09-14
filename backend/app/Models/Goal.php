<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Goal extends Model
{
    use HasFactory;

    protected $fillable = ['name','target_amount','current_amount','priority','allocation_pct','category_id'];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function savingsLogs()
    {
        return $this->hasMany(SavingsLog::class);
    }
}

 
