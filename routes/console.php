<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
|
| This file is where you may define all of your Closure based console
| commands. Each Closure is bound to a command instance allowing a
| simple approach to interacting with each command's IO methods.
|
*/

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('photos:prune', function () {
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
    $this->info("Berhasil menghapus {$count} foto absensi yang usianya lebih dari 24 jam.");
})->purpose('Menghapus foto absensi yang lebih dari 24 jam');
