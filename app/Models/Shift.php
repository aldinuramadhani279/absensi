<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'profession_id',
        'start_time',
        'end_time',
        'crosses_midnight', // Shift malam yang melewati tengah malam
    ];

    protected $casts = [
        'crosses_midnight' => 'boolean',
    ];

    public function profession()
    {
        return $this->belongsTo(Profession::class);
    }
}
