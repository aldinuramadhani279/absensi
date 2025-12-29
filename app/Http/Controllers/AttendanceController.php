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
        $request->validate(['shift_id' => 'required|exists:shifts,id']);

        $user = Auth::user();
        $today = Carbon::today();
        $now = Carbon::now();

        if (Attendance::where('user_id', $user->id)->whereDate('clock_in', $today)->exists()) {
            return response()->json(['message' => 'Anda sudah melakukan clock in hari ini.'], 409);
        }

        if (Attendance::where('clock_in_ip', $request->ip())->where('shift_id', $request->shift_id)->whereDate('clock_in', $today)->exists()) {
            return response()->json(['message' => 'Alamat IP ini sudah digunakan untuk clock in pada shift ini hari ini.'], 409);
        }
        
        $shift = Shift::find($request->shift_id);
        $startTime = Carbon::parse($shift->start_time);
        $status = 'on_time';
        if ($now->gt($startTime)) $status = 'late';
        if ($now->lt($startTime)) $status = 'early';

        $attendance = Attendance::create([
            'user_id' => $user->id,
            'shift_id' => $request->shift_id,
            'clock_in' => $now,
            'clock_in_ip' => $request->ip(),
            'status' => $status,
        ]);

        return response()->json($attendance->load('shift'), 201);
    }

    public function clockOut(Request $request)
    {
        $user = Auth::user();
        $attendance = Attendance::where('user_id', $user->id)
            ->whereDate('clock_in', Carbon::today())
            ->whereNull('clock_out')
            ->first();

        if (!$attendance) {
            return response()->json(['message' => 'Anda belum melakukan clock in atau sudah clock out.'], 404);
        }

        $attendance->update([
            'clock_out' => Carbon::now(),
            'clock_out_ip' => $request->ip(),
        ]);

        return response()->json($attendance->load('shift'));
    }

    public function earlyDeparture(Request $request)
    {
        $request->validate(['notes' => 'required|string']);

        $user = Auth::user();
        $attendance = Attendance::where('user_id', $user->id)
            ->whereDate('clock_in', Carbon::today())
            ->whereNull('clock_out')
            ->first();

        if (!$attendance) {
            return response()->json(['message' => 'Anda belum melakukan clock in hari ini.'], 404);
        }

        $attendance->update([
            'clock_out' => Carbon::now(),
            'clock_out_ip' => $request->ip(),
            'notes' => $request->notes,
            'status' => 'early_departure',
        ]);

        return response()->json($attendance->load('shift'));
    }
}
