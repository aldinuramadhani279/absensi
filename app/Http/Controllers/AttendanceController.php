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
            'photo'    => 'required|string', // base64 string
        ]);

        $user = Auth::user();

        // Validasi: shift harus sesuai profesi user
        $shift = Shift::find($request->shift_id);
        if (!$shift || $shift->profession_id !== $user->profession_id) {
            return response()->json(['message' => 'Shift tidak valid untuk jabatan Anda.'], 403);
        }

        // [FIX C-1] Cek absensi dalam 24 jam terakhir — mendukung shift malam
        // Tidak lagi pakai whereDate(today) agar shift malam tidak reset saat tengah malam
        $existing = Attendance::where('user_id', $user->id)
            ->where('clock_in', '>=', now()->subHours(24))
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
                ->where('clock_in', '>=', now()->subHours(24))
                ->where('user_id', '!=', $user->id)
                ->exists();
            if ($ipUsed) {
                return response()->json(['message' => 'IP Address ini sudah digunakan oleh karyawan lain hari ini untuk absen.'], 400);
            }
        }

        // Simpan Foto
        $photoPath = $this->saveBase64Image($request->photo, 'in_' . $user->id);

        $attendance = Attendance::create([
            'user_id'     => $user->id,
            'date'        => now()->toDateString(),
            'shift_id'    => $request->shift_id,
            'clock_in'    => now(),
            'status'      => 'present',
            'ip_address'  => $request->ip(),
            'clock_in_ip' => $request->ip(),
            'photo_in'    => $photoPath,
            'lat_in'      => $request->latitude ?? null,
            'lon_in'      => $request->longitude ?? null,
        ]);

        // Hitung Keterlambatan
        $statusMessage  = 'Tepat Waktu';
        $status         = 'tepat waktu';
        $statusCode     = 'ontime';
        $timeDiffMessage = '';

        if ($shift) {
            $shiftStartPart = \Carbon\Carbon::parse($shift->start_time);
            $shiftStart     = now()->setTime($shiftStartPart->hour, $shiftStartPart->minute, $shiftStartPart->second);
            $clockInTime    = now();
            $tolerance      = 10;

            if ($clockInTime->gt($shiftStart)) {
                $minsLate = $clockInTime->diffInMinutes($shiftStart);
                if ($minsLate > $tolerance) {
                    $status      = 'terlambat';
                    $statusCode  = 'late';
                    $hours       = intdiv($minsLate, 60);
                    $mins        = $minsLate % 60;
                    $statusMessage   = 'Anda Terlambat';
                    $timeDiffMessage = $hours > 0 ? "{$hours} jam {$mins} menit" : "{$mins} menit";
                } else {
                    $status          = 'tepat waktu';
                    $statusCode      = 'ontime';
                    $statusMessage   = 'Anda Tepat Waktu (Dalam Toleransi)';
                    $timeDiffMessage = "Lewat {$minsLate} menit (masih toleransi)";
                }
            } else {
                $minsEarly = $shiftStart->diffInMinutes($clockInTime);
                if ($minsEarly > $tolerance) {
                    $status          = 'tepat waktu';
                    $statusCode      = 'early';
                    $hours           = intdiv($minsEarly, 60);
                    $mins            = $minsEarly % 60;
                    $statusMessage   = 'Anda Masuk Lebih Awal';
                    $timeDiffMessage = $hours > 0 ? "{$hours} jam {$mins} menit" : "{$mins} menit";
                } else {
                    $status          = 'tepat waktu';
                    $statusCode      = 'ontime';
                    $statusMessage   = 'Anda Tepat Waktu';
                    $timeDiffMessage = 'Tepat waktu';
                }
            }

            $attendance->update(['status' => $status]);
            $attendance->refresh();
        }

        return response()->json([
            'message'      => 'Clock In Berhasil',
            'attendance'   => $attendance,
            'status_label' => $statusMessage,
            'status_code'  => $statusCode,
            'time_diff'    => $timeDiffMessage,
        ]);
    }

    public function clockOut(Request $request)
    {
        $request->validate([
            'photo' => 'required|string', // base64 string
        ]);

        $user = Auth::user();

        // [FIX C-1] Cari absensi yang belum clock out dalam 30 jam terakhir
        // Tidak ada batasan tanggal — mendukung shift malam yang melewati tengah malam
        $attendance = Attendance::where('user_id', $user->id)
            ->whereNull('clock_out')
            ->where('clock_in', '>=', now()->subHours(30))
            ->orderBy('clock_in', 'desc')
            ->first();

        if (!$attendance) {
            return response()->json(['message' => 'Anda belum clock in atau sudah clock out.'], 400);
        }

        // Simpan Foto
        $photoPath = $this->saveBase64Image($request->photo, 'out_' . $user->id);

        $attendance->update([
            'clock_out'    => now(),
            'clock_out_ip' => $request->ip(),
            'photo_out'    => $photoPath,
            'lat_out'      => $request->latitude ?? null,
            'lon_out'      => $request->longitude ?? null,
        ]);

        return response()->json(['message' => 'Clock Out Berhasil', 'attendance' => $attendance]);
    }

    /**
     * [N-1] Ganti shift setelah clock out.
     * Reset clock_out dan ganti shift, user bisa clock out ulang dengan shift baru.
     */
    public function changeShift(Request $request)
    {
        $request->validate([
            'shift_id' => 'required|exists:shifts,id',
        ]);

        $user = Auth::user();

        // Validasi: shift harus sesuai profesi user
        $shift = Shift::find($request->shift_id);
        if (!$shift || $shift->profession_id !== $user->profession_id) {
            return response()->json(['message' => 'Shift tidak valid untuk jabatan Anda.'], 403);
        }

        // Cari attendance terbaru yang sudah clock out dalam 30 jam terakhir
        $attendance = Attendance::where('user_id', $user->id)
            ->whereNotNull('clock_out')
            ->where('clock_in', '>=', now()->subHours(30))
            ->orderBy('clock_in', 'desc')
            ->first();

        if (!$attendance) {
            return response()->json(['message' => 'Tidak ada data absensi hari ini yang bisa diganti shiftnya.'], 400);
        }

        // Jangan izinkan ganti ke shift yang sama
        if ($attendance->shift_id === $shift->id) {
            return response()->json(['message' => 'Shift yang dipilih sama dengan shift sebelumnya.'], 400);
        }

        // Reset clock_out dan ganti shift
        $attendance->update([
            'shift_id'      => $shift->id,
            'clock_out'     => null,
            'clock_out_ip'  => null,
            'photo_out'     => null,
            'lat_out'       => null,
            'lon_out'       => null,
        ]);

        return response()->json([
            'message'    => 'Shift berhasil diganti. Silakan lakukan Clock Out kembali.',
            'attendance' => $attendance->fresh()->load('shift'),
        ]);
    }
}
