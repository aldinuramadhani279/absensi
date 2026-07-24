<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\Attendance;
use App\Models\Shift;
use App\Models\Setting;

class AttendanceController extends Controller
{
    // Fitur Geofencing dan Radius dihapus atas permintaan pengguna

    /**
     * Simpan gambar base64 ke storage publik
     */
    private function saveBase64Image($base64String, $prefix)
    {
        // Pisahkan data URI dari data base64 (format: data:image/png;base64,.....)
        @list($type, $file_data) = explode(';', $base64String);
        @list(, $file_data) = explode(',', $file_data);

        // Dekode base64 menjadi file binary
        $image = base64_decode($file_data);

        // Tentukan nama file unik
        $imageName = $prefix . '_' . time() . '_' . Str::random(10) . '.png';

        // Simpan menggunakan disk 'public' (folder: storage/app/public/attendances)
        Storage::disk('public')->put('attendances/' . $imageName, $image);

        return 'attendances/' . $imageName;
    }

    public function clockIn(Request $request)
    {
        $request->validate([
            'shift_id' => 'required|exists:shifts,id',
            'photo' => 'required|string', // base64 string
        ]);

        $user = Auth::user();
        $today = now()->today();

        // Validasi: shift harus sesuai profesi user
        $shift = Shift::find($request->shift_id);
        if (!$shift || $shift->profession_id !== $user->profession_id) {
            return response()->json(['message' => 'Shift tidak valid untuk jabatan Anda.'], 403);
        }

        // Check if already clocked in today
        $existing = Attendance::where('user_id', $user->id)
            ->whereDate('created_at', $today)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Anda sudah melakukan clock in hari ini.'], 400);
        }

        // Validasi: IP Address ganda hari ini (dikontrol oleh Pengaturan Admin ON/OFF)
        $blockDuplicateIp = Setting::get('block_duplicate_ip', '1') !== '0';
        $clientIp = $request->ip();
        if ($blockDuplicateIp && $clientIp) {
            $ipUsed = Attendance::where(function ($q) use ($clientIp) {
                    $q->where('ip_address', $clientIp)
                      ->orWhere('clock_in_ip', $clientIp);
                })
                ->whereDate('created_at', $today)
                ->where('user_id', '!=', $user->id)
                ->exists();
            if ($ipUsed) {
                return response()->json(['message' => 'IP Address ini sudah digunakan oleh karyawan lain hari ini untuk absen.'], 400);
            }
        }

        // Simpan Foto
        $photoPath = $this->saveBase64Image($request->photo, 'in_' . $user->id);

        $attendance = Attendance::create([
            'user_id' => $user->id,
            'date' => now()->toDateString(),
            'shift_id' => $request->shift_id,
            'clock_in' => now(),
            'status' => 'present',
            'ip_address' => $request->ip(),
            'clock_in_ip' => $request->ip(),
            'photo_in' => $photoPath,
            'lat_in' => $request->latitude ?? null,
            'lon_in' => $request->longitude ?? null,
        ]);
        
        // Hitung Keterlambatan (menggunakan $shift yang sudah divalidasi di atas)
        $statusMessage = 'Tepat Waktu';
        $status = 'tepat waktu';
        $statusCode = 'ontime'; 
        $timeDiffMessage = '';
        
        if ($shift) {
            $shiftStartPart = \Carbon\Carbon::parse($shift->start_time);
            $shiftStart = now()->setTime($shiftStartPart->hour, $shiftStartPart->minute, $shiftStartPart->second);
            $clockInTime = now();
            $tolerance = 10; 
            
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
                    $status = 'tepat waktu';
                    $statusCode = 'ontime';
                    $statusMessage = 'Anda Tepat Waktu (Dalam Toleransi)';
                    $timeDiffMessage = "Lewat {$minsLate} menit (masih toleransi)";
                }
            } else {
                $minsEarly = $shiftStart->diffInMinutes($clockInTime);
                if ($minsEarly > $tolerance) {
                    $status = 'tepat waktu';
                    $statusCode = 'early';
                    $hours = intdiv($minsEarly, 60);
                    $mins = $minsEarly % 60;
                    $statusMessage = 'Anda Masuk Lebih Awal';
                    $timeDiffMessage = $hours > 0 ? "{$hours} jam {$mins} menit" : "{$mins} menit";
                } else {
                    $status = 'tepat waktu';
                    $statusCode = 'ontime';
                    $statusMessage = 'Anda Tepat Waktu';
                    $timeDiffMessage = 'Tepat waktu';
                }
            }
            
            $attendance->update(['status' => $status]);
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
        $request->validate([
            'photo' => 'required|string', // base64 string
        ]);

        $user = Auth::user();

        $today = now()->today();
        $attendance = Attendance::where('user_id', $user->id)
            ->whereDate('created_at', $today)
            ->whereNull('clock_out')
            ->first();

        if (!$attendance) {
            return response()->json(['message' => 'Anda belum clock in atau sudah clock out.'], 400);
        }
        
        // Simpan Foto
        $photoPath = $this->saveBase64Image($request->photo, 'out_' . $user->id);

        $attendance->update([
            'clock_out' => now(),
            'clock_out_ip' => $request->ip(),
            'photo_out' => $photoPath,
            'lat_out' => $request->latitude ?? null,
            'lon_out' => $request->longitude ?? null,
        ]);

        return response()->json(['message' => 'Clock Out Berhasil', 'attendance' => $attendance]);
    }
}
