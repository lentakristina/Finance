<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = ['category_id', 'amount', 'date', 'note'];

    // Accessor untuk otomatis format Rupiah
    protected $appends = ['amount_rupiah'];

    public function getAmountRupiahAttribute()
    {
        return 'Rp ' . number_format($this->attributes['amount'], 0, ',', '.');
    }

 // app/Models/Transaction.php
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    protected $casts = [
        'amount' => 'float',
    ];
}