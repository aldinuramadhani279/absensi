<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Attendance;
use App\Models\Shift;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function clockIn(Request $request)
    {
        $request->validate([
            'shift_id' => 'required|exists:shifts,id',
        ]);

        $user = Auth::user();
        $today = Carbon::today();
        $now = Carbon::now();

        // Check if user has already clocked in today
        $existingAttendance = Attendance::where('user_id', $user->id)
            ->whereDate('clock_in', $today)
            ->first();

        if ($existingAttendance) {
            return redirect()->route('home')->with('error', 'Anda sudah melakukan clock in hari ini.');
        }

        // Check if IP address has been used for this shift today
        $ipAttendance = Attendance::where('clock_in_ip', $request->ip())
            ->where('shift_id', $request->shift_id)
            ->whereDate('clock_in', $today)
            ->first();

        if ($ipAttendance) {
            return redirect()->route('home')->with('error', 'Alamat IP ini sudah digunakan untuk clock in pada shift ini hari ini.');
        }
        
        $shift = Shift::find($request->shift_id);
        $startTime = Carbon::parse($shift->start_time);

        $status = $now->gt($startTime) ? 'late' : 'on_time';
        
        // The prompt says "warna merah kalo datang lebih awal nanti warna biru" 
        // which implies early is also a status
        if($now->lt($startTime)) {
            $status = 'early';
        }


        Attendance::create([
            'user_id' => $user->id,
            'shift_id' => $request->shift_id,
            'clock_in' => $now,
            'clock_in_ip' => $request->ip(),
            'status' => $status,
        ]);

        return redirect()->route('home')->with('success', 'Anda berhasil melakukan clock in.');
    }

    public function clockOut(Request $request)
    {
        $user = Auth::user();
        $today = Carbon::today();

        $attendance = Attendance::where('user_id', $user->id)
            ->whereDate('clock_in', $today)
            ->whereNull('clock_out')
            ->first();

        if (!$attendance) {
            return redirect()->route('home')->with('error', 'Anda belum melakukan clock in hari ini atau sudah melakukan clock out.');
        }

        $attendance->update([
            'clock_out' => Carbon::now(),
            'clock_out_ip' => $request->ip(),
        ]);

        return redirect()->route('home')->with('success', 'Anda berhasil melakukan clock out.');
    }

    public function earlyDeparture(Request $request)
    {
        $request->validate([
            'notes' => 'required|string',
        ]);

        $user = Auth::user();
        $today = Carbon::today();

        $attendance = Attendance::where('user_id', $user->id)
            ->whereDate('clock_in', $today)
            ->whereNull('clock_out')
            ->first();

        if (!$attendance) {
            return redirect()->route('home')->with('error', 'Anda belum melakukan clock in hari ini.');
        }

        $attendance->update([
            'clock_out' => Carbon::now(),
            'clock_out_ip' => $request->ip(),
            'notes' => $request->notes,
            'status' => 'early_departure',
        ]);

        return redirect()->route('home')->with('success', 'Permintaan pulang lebih awal Anda telah dikirim.');
    }
}
