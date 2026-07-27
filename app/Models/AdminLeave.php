<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminLeave extends Model
{
    protected $fillable = [
        'user_id',
        'start_date',
        'end_date',
        'type',
        'notes',
        'granted_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function grantedBy()
    {
        return $this->belongsTo(User::class, 'granted_by');
    }

    /**
     * Label tipe izin yang lebih ramah dibaca.
     */
    public function getTypeLabelAttribute(): string
    {
        return match($this->type) {
            'sakit'       => 'Sakit',
            'cuti'        => 'Cuti',
            'izin_resmi'  => 'Izin Resmi',
            'dinas_luar'  => 'Dinas Luar',
            default       => 'Lainnya',
        };
    }
}
