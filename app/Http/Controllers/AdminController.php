<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function index()
    {
        $requests = \App\Models\PasswordResetRequest::with('user')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($request) {
                return [
                    'id'               => $request->id,
                    'user_name'        => optional($request->user)->name ?? 'User Terhapus',
                    'user_email'       => optional($request->user)->email ?? '-',
                    'user_nip'         => optional($request->user)->nip ?? '-',
                    'user_employee_id' => optional($request->user)->employee_id ?? '-',
                    'requested_at'     => $request->created_at ? $request->created_at->toIso8601String() : now()->toIso8601String(),
                    'status'           => $request->status,
                ];
            });

        $today = now()->today();

        // [FIX N-5] Ganti N+1 query dengan single query + PHP groupBy
        // Sebelumnya: 1 query untuk list IP + N query per IP
        // Sekarang: 1 query saja, diproses di PHP
        $allDupAttendances = \App\Models\Attendance::whereDate('created_at', $today)
            ->whereNotNull('clock_in_ip')
            ->with('user')
            ->get()
            ->groupBy('clock_in_ip')
            ->filter(fn($group) => $group->count() > 1);

        $duplicateIpAlerts = $allDupAttendances->map(function ($group, $ip) {
            return [
                'ip_address' => $ip,
                'total'      => $group->count(),
                'users'      => $group->map(fn($a) => [
                    'name'     => $a->user->name ?? 'Unknown',
                    'time'     => $a->created_at->format('H:i:s'),
                    'photo_in' => $a->photo_in,
                ])->values(),
            ];
        })->values();

        $blockDuplicateIp = \App\Models\Setting::get('block_duplicate_ip', '1') !== '0';

        // [FITUR SHIFT CUSTOM ALERT] Karyawan yang absen pakai Shift Custom hari ini
        $customShiftAlerts = \App\Models\Attendance::whereDate('created_at', $today)
            ->where(function ($q) {
                $q->whereNotNull('custom_shift_start')
                  ->orWhereNull('shift_id');
            })
            ->with(['user.profession'])
            ->orderBy('clock_in', 'desc')
            ->get()
            ->map(function ($att) {
                return [
                    'id'                 => $att->id,
                    'user_name'          => optional($att->user)->name ?? 'Unknown',
                    'user_profession'    => optional(optional($att->user)->profession)->name ?? '-',
                    'custom_shift_start' => $att->custom_shift_start ?? '-',
                    'custom_shift_end'   => $att->custom_shift_end ?? '-',
                    'clock_in'           => $att->clock_in ? \Carbon\Carbon::parse($att->clock_in)->format('H:i') : '-',
                    'photo_in'           => $att->photo_in,
                ];
            });

        $lateToleranceMinutes = (int) \App\Models\Setting::get('late_tolerance_minutes', '10');

        $stats = [
            'total_employees'        => \App\Models\User::where('is_admin', false)->count(),
            'today_attendances'      => \App\Models\Attendance::whereDate('created_at', $today)->count(),
            'today_late'             => \App\Models\Attendance::whereDate('created_at', $today)->where('status', 'terlambat')->count(),
            'pending_leaves'         => \App\Models\LeaveRequest::where('status', 'pending')->count(),
            'pending_travels'        => \App\Models\TravelRequest::where('status', 'pending')->count(),
            'pending_password_resets' => \App\Models\PasswordResetRequest::where('status', 'pending')->count(),
        ];

        return Inertia::render('Admin/Dashboard', [
            'requests'             => $requests,
            'duplicateIpAlerts'    => $duplicateIpAlerts,
            'blockDuplicateIp'     => $blockDuplicateIp,
            'customShiftAlerts'    => $customShiftAlerts,
            'lateToleranceMinutes' => $lateToleranceMinutes,
            'stats'                => $stats,
        ]);
    }

    public function toggleDuplicateIp(Request $request)
    {
        $enabled = $request->input('enabled', true);
        \App\Models\Setting::set('block_duplicate_ip', $enabled ? '1' : '0');

        return redirect()->back()->with('message', 'Pengaturan blokir IP duplikat berhasil diperbarui.');
    }

    public function updateLateTolerance(Request $request)
    {
        $request->validate([
            'minutes' => 'required|integer|min:0|max:240',
        ]);

        \App\Models\Setting::set('late_tolerance_minutes', (string) $request->minutes);

        return redirect()->back()->with('message', 'Toleransi keterlambatan berhasil diperbarui.');
    }

    public function getPasswordResets()
    {
        $requests = \App\Models\PasswordResetRequest::with('user')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($request) {
                return [
                    'id'               => $request->id,
                    'user_name'        => $request->user->name,
                    'user_email'       => $request->user->email,
                    'user_nip'         => $request->user->nip,
                    'user_employee_id' => $request->user->employee_id,
                    'requested_at'     => $request->created_at->toIso8601String(),
                    'status'           => $request->status,
                ];
            });

        return response()->json(['requests' => $requests]);
    }

    public function approvePasswordReset($id)
    {
        $request = \App\Models\PasswordResetRequest::findOrFail($id);

        if ($request->status !== 'pending') {
            return response()->json(['message' => 'Request already processed'], 400);
        }

        $user = $request->user;

        // [FIX N-4] Password default diambil dari config/env, tidak hard-coded
        $defaultPassword = config('app.reset_password_default', '12345678');
        $user->password = \Illuminate\Support\Facades\Hash::make($defaultPassword);
        $user->must_change_password = true;
        $user->save();

        $request->status      = 'approved';
        $request->approved_at = now();
        $request->save();

        return response()->json(['message' => 'Success']);
    }

    public function prunePhotos()
    {
        $attendances = \App\Models\Attendance::where('created_at', '<', now()->subHours(24))->get();
        $count = 0;
        foreach ($attendances as $a) {
            if ($a->photo_in && \Illuminate\Support\Facades\Storage::disk('public')->exists($a->photo_in)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($a->photo_in);
                $a->photo_in = null;
                $count++;
            }
            if ($a->photo_out && \Illuminate\Support\Facades\Storage::disk('public')->exists($a->photo_out)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($a->photo_out);
                $a->photo_out = null;
                $count++;
            }
            $a->save();
        }

        return redirect()->back()->with('message', "Berhasil menghapus {$count} foto absensi yang usianya lebih dari 24 jam.");
    }
}
