<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Whistleblowing extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'details',
        'reported_name',
        'photo_evidence'
    ];
}
