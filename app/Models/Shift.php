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
    ];

    public function profession()
    {
        return $this->belongsTo(Profession::class);
    }
}
