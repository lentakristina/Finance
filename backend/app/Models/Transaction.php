<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'category_id',
        'goal_id',   // pastikan ada ini
        'amount',
        'date',
        'note',
    ];

    // Relations
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    // Ini yang hilang / salah
    public function goal()
    {
        return $this->belongsTo(Goal::class);
    }

    // Optional: format Rupiah
    protected $appends = ['amount_rupiah'];
    public function getAmountRupiahAttribute()
    {
        return 'Rp ' . number_format($this->attributes['amount'], 0, ',', '.');
    }

    protected $casts = [
        'amount' => 'decimal:2',
        'date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
}
