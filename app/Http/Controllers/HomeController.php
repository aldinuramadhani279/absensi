<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class HomeController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        $attendance = \App\Models\Attendance::where('user_id', $user->id)
            ->whereDate('created_at', now()->today())
            ->first();

        // Hanya tampilkan shift yang sesuai dengan profesi/jabatan user yang login
        $shifts = \App\Models\Shift::where('profession_id', $user->profession_id)->get();
        
        $has_forgot_clock_out = \App\Models\Attendance::where('user_id', $user->id)
            ->whereNull('clock_out')
            ->whereDate('created_at', '<', now()->today())
            ->exists();

        // Pengecekan IP duplikat untuk hari ini
        $clientIp = request()->ip();
        $duplicate_ip_users = [];
        $has_duplicate_ip = false;
        if ($clientIp) {
            $duplicate_ip_users = \App\Models\Attendance::where('ip_address', $clientIp)
                ->whereDate('created_at', now()->today())
                ->where('user_id', '!=', $user->id)
                ->with('user')
                ->get()
                ->pluck('user.name')
                ->unique()
                ->toArray();
            $has_duplicate_ip = count($duplicate_ip_users) > 0;
        }
        
        return Inertia::render('User/Dashboard', [
            'auth' => [
                'user' => $user
            ],
            'attendance' => $attendance,
            'shifts' => $shifts,
            'has_forgot_clock_out' => $has_forgot_clock_out,
            'has_duplicate_ip' => $has_duplicate_ip,
            'duplicate_ip_users' => array_values($duplicate_ip_users),
        ]);
    }
}
