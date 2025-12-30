<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Attendance;
use App\Models\Shift;

class AttendanceController extends Controller
{
    public function clockIn(Request $request)
    {
        $request->validate([
            'shift_id' => 'required|exists:shifts,id',
        ]);

        $user = Auth::user();
        $today = now()->today();

        // Check if already clocked in today
        $existing = Attendance::where('user_id', $user->id)
            ->whereDate('created_at', $today)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Anda sudah melakukan clock in hari ini.'], 400);
        }

        // Check for unresolved previous attendance (forgot clock out)
        $forgotOut = Attendance::where('user_id', $user->id)
            ->whereNull('clock_out')
            ->whereDate('created_at', '<', $today)
            ->exists();

        if ($forgotOut) {
            // Logic can vary here, maybe block or allow with warning. 
            // For now, let's allow but maybe the frontend shows a warning (which it does).
        }
        
        $attendance = Attendance::create([
            'user_id' => $user->id,
            'shift_id' => $request->shift_id,
            'clock_in' => now(),
            'status' => 'present',
            'clock_in_ip' => $request->ip(),
        ]);
        
        // Determine status based on shift time and simple 10m tolerance
        $shift = Shift::find($request->shift_id);
        $statusMessage = 'Tepat Waktu';
        $status = 'tepat waktu';
        $statusCode = 'ontime'; // early, ontime, late
        $timeDiffMessage = '';
        
        if ($shift) {
            // Shift start time from DB is usually H:i:s string
            $shiftStartPart = \Carbon\Carbon::parse($shift->start_time);
            
            // Create Carbon instance for Today at Shift Start Time
            $shiftStart = now()->setTime($shiftStartPart->hour, $shiftStartPart->minute, $shiftStartPart->second);
            
            // The actual clock-in time
            $clockInTime = now();
            
            // Tolerance in minutes
            $tolerance = 10; 
            
            // Check if Late
            if ($clockInTime->gt($shiftStart)) {
                $minsLate = $clockInTime->diffInMinutes($shiftStart);
                
                if ($minsLate > $tolerance) {
                    $status = 'terlambat';
                    $statusCode = 'late';
                    $hours = intdiv($minsLate, 60);
                    $mins = $minsLate % 60;
                    $statusMessage = 'Anda Terlambat';
                    $timeDiffMessage = $hours > 0 ? "{$hours} jam {$mins} menit" : "{$mins} menit";
                } else {
                    // Within 10 mins tolerance after start
                    $status = 'tepat waktu';
                    $statusCode = 'ontime';
                    $statusMessage = 'Anda Tepat Waktu (Dalam Toleransi)';
                    $timeDiffMessage = "Lewat {$minsLate} menit (masih toleransi)";
                }
            } else {
                // Early (Before start)
                $minsEarly = $shiftStart->diffInMinutes($clockInTime);
                
                if ($minsEarly > $tolerance) {
                    $status = 'lebih awal'; // or 'tepat waktu' if you don't track early separately in DB
                    $statusCode = 'early';
                    $hours = intdiv($minsEarly, 60);
                    $mins = $minsEarly % 60;
                    $statusMessage = 'Anda Masuk Lebih Awal';
                    $timeDiffMessage = $hours > 0 ? "{$hours} jam {$mins} menit" : "{$mins} menit";
                } else {
                    // Within 10 mins before start
                    $status = 'tepat waktu';
                    $statusCode = 'ontime';
                    $statusMessage = 'Anda Tepat Waktu';
                    $timeDiffMessage = 'Tepat waktu';
                }
            }
            
            // Update the attendance record with the determined status
            $attendance->update([
                'status' => $status
            ]);
            
            // Re-fetch to ensure object is sync
            $attendance->refresh();
        }

        return response()->json([
            'message' => 'Clock In Berhasil', 
            'attendance' => $attendance,
            'status_label' => $statusMessage,
            'status_code' => $statusCode,
            'time_diff' => $timeDiffMessage
        ]);
    }

    public function clockOut(Request $request)
    {
        $user = Auth::user();
        $today = now()->today();

        $attendance = Attendance::where('user_id', $user->id)
            ->whereDate('created_at', $today)
            ->whereNull('clock_out')
            ->first();

        if (!$attendance) {
            return response()->json(['message' => 'Anda belum clock in atau sudah clock out.'], 400);
        }

        $attendance->update([
            'clock_out' => now(),
            'clock_out_ip' => $request->ip(),
        ]);

        return response()->json(['message' => 'Clock Out Berhasil', 'attendance' => $attendance]);
    }
}
