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

        // [FIX] Prioritas 1: Cari sesi aktif (belum clock out) TANPA BATASAN WAKTU
        // Sesi dari hari mana pun yang belum ditutup akan ditemukan
        $activeAttendance = \App\Models\Attendance::where('user_id', $user->id)
            ->whereNull('clock_out')
            ->with('shift')
            ->orderBy('clock_in', 'desc')
            ->first();

        // [FIX] Prioritas 2: Jika tidak ada sesi aktif, cari sesi selesai dalam 24 jam terakhir
        // (untuk keperluan tampilan Double Shift window)
        $recentCompleted = null;
        if (!$activeAttendance) {
            $recentCompleted = \App\Models\Attendance::where('user_id', $user->id)
                ->whereNotNull('clock_out')
                ->where('clock_in', '>=', now()->subHours(24))
                ->with('shift')
                ->orderBy('clock_in', 'desc')
                ->first();
        }

        $attendance = $activeAttendance ?? $recentCompleted;

        // Hanya tampilkan shift yang sesuai dengan profesi/jabatan user yang login
        $shifts = \App\Models\Shift::where('profession_id', $user->profession_id)->get();

        // [FIX] has_forgot_clock_out: sesi aktif sudah berlangsung > 14 jam
        // (batas 14 jam agar shift malam yang masih kerja tidak dianggap lupa)
        $has_forgot_clock_out = $activeAttendance !== null
            && $activeAttendance->clock_in < now()->subHours(14);

        // [FIX N-2] Cek IP duplikat hanya jika setting block_duplicate_ip aktif
        $clientIp = request()->ip();
        $duplicate_ip_users = [];
        $has_duplicate_ip = false;
        $blockDuplicateIp = \App\Models\Setting::get('block_duplicate_ip', '1') !== '0';

        if ($clientIp && $blockDuplicateIp) {
            $duplicate_ip_users = \App\Models\Attendance::where('ip_address', $clientIp)
                ->where('clock_in', '>=', now()->subHours(24))
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
            'attendance'           => $attendance,
            'shifts'               => $shifts,
            'has_forgot_clock_out' => $has_forgot_clock_out,
            'has_duplicate_ip'     => $has_duplicate_ip,
            'duplicate_ip_users'   => array_values($duplicate_ip_users),
        ]);
    }
}
