<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FeeComponent extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'default_amount',
        'is_active'
    ];

    protected $casts = [
        'default_amount' => 'decimal:2',
        'is_active' => 'boolean'
    ];
}
