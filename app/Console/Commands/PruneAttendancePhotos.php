<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use App\Models\Attendance;
use Carbon\Carbon;

class PruneAttendancePhotos extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'attendance:prune-photos';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Hapus foto absensi yang umurnya sudah lebih dari 24 jam untuk menghemat storage';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Memulai proses penghapusan foto yang lebih dari 24 jam...");

        // Cari record yang dibuat 24 jam yang lalu atau lebih lama dan fotonya tidak null
        $threshold = Carbon::now()->subHours(24);

        $attendances = Attendance::where('created_at', '<=', $threshold)
            ->where(function ($query) {
                $query->whereNotNull('photo_in')
                      ->orWhereNotNull('photo_out');
            })->get();

        $count = 0;

        foreach ($attendances as $attendance) {
            if ($attendance->photo_in) {
                if (Storage::disk('public')->exists($attendance->photo_in)) {
                    Storage::disk('public')->delete($attendance->photo_in);
                    $count++;
                }
                $attendance->photo_in = null;
            }

            if ($attendance->photo_out) {
                if (Storage::disk('public')->exists($attendance->photo_out)) {
                    Storage::disk('public')->delete($attendance->photo_out);
                    $count++;
                }
                $attendance->photo_out = null;
            }

            // Simpan perubahan ke database tanpa memicu update timestamp 'updated_at' agar tidak membingungkan
            $attendance->timestamps = false;
            $attendance->save();
        }

        $this->info("Berhasil menghapus {$count} foto.");
    }
}
