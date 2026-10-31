<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nis',
        'full_name',
        'gender',
        'date_of_birth',
        'phone_number',
        'address',
        'parent_name',
        'parent_phone'
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'is_active' => 'boolean'
    ];

    public function classAsignment(): HasMany
    {
        return $this->hasMany(StudentClassAssignment::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
