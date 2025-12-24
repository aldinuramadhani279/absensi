<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Attendance;
use Carbon\Carbon;

class PruneOldAttendances extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'attendance:prune';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Prune attendance records older than 3 months.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $cutoffDate = Carbon::now()->subMonths(3);
        $deletedRows = Attendance::where('created_at', '<', $cutoffDate)->delete();
        $this->info("Pruned {$deletedRows} old attendance records.");
        return 0;
    }
}
