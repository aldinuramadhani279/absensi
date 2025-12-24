<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PasswordResetRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'status',
        'token',
        'approved_at',
        'rejected_at',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}