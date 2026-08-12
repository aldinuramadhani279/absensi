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
     * Simpan gambar (Upload Binary File atau Base64) ke storage publik
     */
    private function savePhoto(Request $request, string $fieldKey, string $prefix): string
    {
        if ($request->hasFile($fieldKey)) {
            $file = $request->file($fieldKey);
            $ext = $file->getClientOriginalExtension() ?: 'jpg';
            $imageName = $prefix . '_' . time() . '_' . Str::random(10) . '.' . $ext;
            $file->storeAs('attendances', $imageName, 'public');
            return 'attendances/' . $imageName;
        }

        if ($request->filled($fieldKey)) {
            return $this->saveBase64Image($request->input($fieldKey), $prefix);
        }

        throw new \InvalidArgumentException("Foto absensi tidak ditemukan.");
    }

    /**
     * Simpan gambar base64 ke storage publik (dukung format JPEG / PNG)
     */
    private function saveBase64Image($base64String, $prefix)
    {
        $ext = 'jpg';
        $imageData = $base64String;

        if (str_contains($base64String, ';base64,')) {
            $parts = explode(';base64,', $base64String);
            $imageData = $parts[1];
            if (str_contains($parts[0], 'png')) {
                $ext = 'png';
            }
        } elseif (str_contains($base64String, ',')) {
            $parts = explode(',', $base64String);
            $imageData = $parts[1];
        }

        // Dekode base64 menjadi file binary
        $image = base64_decode($imageData);

        // Tentukan nama file unik
        $imageName = $prefix . '_' . time() . '_' . Str::random(10) . '.' . $ext;

        // Simpan menggunakan disk 'public' (folder: storage/app/public/attendances)
        Storage::disk('public')->put('attendances/' . $imageName, $image);

        return 'attendances/' . $imageName;
    }

    public function clockIn(Request $request)
    {
        // Validasi dasar — shift harus selalu dari DB (tidak ada lagi custom shift oleh user)
        $request->validate([
            'shift_id' => 'required|exists:shifts,id',
            'photo'    => 'required',
        ]);

        $user = Auth::user();

        // Validasi shift harus sesuai profesi user
        $shift = Shift::find($request->shift_id);
        if (!$shift || $shift->profession_id !== $user->profession_id) {
            return response()->json(['message' => 'Shift tidak valid untuk jabatan Anda.'], 403);
        }

        // [FIX] Cek sesi aktif TANPA BATASAN WAKTU agar sesi dari hari sebelumnya juga terdeteksi
        $existingActive = Attendance::where('user_id', $user->id)
            ->whereNull('clock_out')
            ->first();

        if ($existingActive) {
            return response()->json(['message' => 'Anda masih memiliki sesi shift yang sedang berjalan. Silakan Clock Out atau gunakan tombol Lupa Clock Out terlebih dahulu.'], 400);
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

        $isCustomShift = str_contains(strtolower($shift->name ?? ''), 'custom');
        $customStart = $isCustomShift ? ($request->input('custom_shift_start') ?: now()->format('H:i')) : null;

        // Simpan Foto
        $photoPath = $this->savePhoto($request, 'photo', 'in_' . $user->id);

        $attendance = Attendance::create([
            'user_id'            => $user->id,
            'date'               => now()->toDateString(),
            'shift_id'           => $request->shift_id,
            'custom_shift_start' => $customStart,
            'custom_shift_end'   => null,
            'clock_in'           => now(),
            'status'             => 'present',
            'ip_address'         => $request->ip(),
            'clock_in_ip'        => $request->ip(),
            'photo_in'           => $photoPath,
            'lat_in'             => $request->latitude ?? null,
            'lon_in'             => $request->longitude ?? null,
        ]);

        // Hitung Keterlambatan (hanya untuk shift normal)
        $statusMessage  = 'Tepat Waktu';
        $status         = 'tepat waktu';
        $statusCode     = 'ontime';
        $timeDiffMessage = '';

        if ($isCustomShift) {
            $statusMessage   = 'Shift Custom';
            $status          = 'tepat waktu';
            $statusCode      = 'ontime';
            $timeDiffMessage = "Jam Masuk Custom: {$customStart}";
            $attendance->update(['status' => 'tepat waktu']);
        } elseif ($shift) {
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
            'photo' => 'required', // File object (FormData) or Base64 string
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
        $photoPath = $this->savePhoto($request, 'photo', 'out_' . $user->id);

        $attendance->update([
            'clock_out'        => now(),
            'clock_out_ip'     => $request->ip(),
            'custom_shift_end' => now()->format('H:i'), // Catat jam keluar otomatis
            'photo_out'        => $photoPath,
            'lat_out'          => $request->latitude ?? null,
            'lon_out'          => $request->longitude ?? null,
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

        // Cari attendance terbaru yang sudah clock out secara normal (bukan auto-closed) dalam 30 jam terakhir
        $attendance = Attendance::where('user_id', $user->id)
            ->whereNotNull('clock_out')
            ->where('is_auto_closed', false)
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

    /**
     * [FITUR LUPA CLOCK OUT]
     * User melaporkan lupa clock out — auto-close absensi aktif agar bisa clock in fresh.
     * Admin bisa melihat record ini di laporan (is_auto_closed = true).
     * [FIX] Tidak ada batasan waktu — sesi dari hari mana pun bisa ditutup.
     */
    public function forgotClockOut(Request $request)
    {
        $user = Auth::user();

        // [FIX] Cari sesi aktif TANPA BATASAN WAKTU (bukan hanya 30 jam terakhir)
        $attendance = Attendance::where('user_id', $user->id)
            ->whereNull('clock_out')
            ->orderBy('clock_in', 'desc')
            ->first();

        if (!$attendance) {
            return response()->json(['message' => 'Tidak ada sesi presensi aktif yang ditemukan.'], 404);
        }

        $prevNotes = $attendance->notes ? $attendance->notes . ' | ' : '';

        $attendance->update([
            'clock_out'      => now(),
            'clock_out_ip'   => $request->ip(),
            'is_auto_closed' => true,
            'notes'          => $prevNotes . 'Lupa Clock Out — dikonfirmasi oleh karyawan pada ' . now()->format('d/m/Y H:i'),
        ]);

        return response()->json([
            'message'    => 'Sesi sebelumnya berhasil direset. Silakan lakukan Clock In kembali.',
            'attendance' => $attendance,
        ]);
    }
}
