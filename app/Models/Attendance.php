<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'shift_id',
        'clock_in',
        'clock_out',
        'clock_in_ip',
        'clock_out_ip',
        'status',
        'ip_address',
        'notes',
        'photo_in',
        'lat_in',
        'lon_in',
        'photo_out',
        'lat_out',
        'lon_out',
        'is_auto_closed',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }
}
