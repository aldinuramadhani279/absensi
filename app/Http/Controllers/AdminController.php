<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function index()
    {
        $requests = \App\Models\PasswordResetRequest::with('user')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($request) {
                return [
                    'id' => $request->id,
                    'user_name' => $request->user->name,
                    'user_email' => $request->user->email,
                    'user_nip' => $request->user->nip,
                    'user_employee_id' => $request->user->employee_id,
                    'requested_at' => $request->created_at->toIso8601String(),
                    'status' => $request->status,
                ];
            });

        $today = now()->today();
        $duplicateIpAlerts = \App\Models\Attendance::whereDate('created_at', $today)
            ->whereNotNull('clock_in_ip')
            ->select('clock_in_ip as ip_address', \DB::raw('count(*) as total'))
            ->groupBy('clock_in_ip')
            ->having('total', '>', 1)
            ->get()
            ->map(function ($dup) use ($today) {
                $attendances = \App\Models\Attendance::where('clock_in_ip', $dup->ip_address)
                    ->whereDate('created_at', $today)
                    ->with('user')
                    ->get();
                
                return [
                    'ip_address' => $dup->ip_address,
                    'total' => $dup->total,
                    'users' => $attendances->map(function ($a) {
                        return [
                            'name' => $a->user->name ?? 'Unknown',
                            'time' => $a->created_at->format('H:i:s'),
                            'photo_in' => $a->photo_in,
                        ];
                    })
                ];
            });

        $blockDuplicateIp = \App\Models\Setting::get('block_duplicate_ip', '1') !== '0';

        return Inertia::render('Admin/Dashboard', [
            'requests' => $requests,
            'duplicateIpAlerts' => $duplicateIpAlerts,
            'blockDuplicateIp' => $blockDuplicateIp,
        ]);
    }

    public function toggleDuplicateIp(Request $request)
    {
        $enabled = $request->input('enabled', true);
        \App\Models\Setting::set('block_duplicate_ip', $enabled ? '1' : '0');

        return redirect()->back()->with('message', 'Pengaturan blokir IP duplikat berhasil diperbarui.');
    }

    public function getPasswordResets()
    {
        $requests = \App\Models\PasswordResetRequest::with('user')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($request) {
                return [
                    'id' => $request->id,
                    'user_name' => $request->user->name,
                    'user_email' => $request->user->email,
                    'user_nip' => $request->user->nip,
                    'user_employee_id' => $request->user->employee_id,
                    'requested_at' => $request->created_at->toIso8601String(),
                    'status' => $request->status,
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
        $user->password = \Illuminate\Support\Facades\Hash::make('12345678');
        $user->must_change_password = true;
        $user->save();

        $request->status = 'approved';
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
