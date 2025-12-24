<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Shift;
use App\Models\Attendance;
use Carbon\Carbon;

class SendAttendanceReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'attendance:remind';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Find users who have not clocked in for their active shift and list them.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = Carbon::now();
        $today = $now->format('Y-m-d');

        // Find shifts that are currently active
        $activeShifts = Shift::where('start_time', '<=', $now->format('H:i:s'))
            ->where('end_time', '>=', $now->format('H:i:s'))
            ->get();

        if ($activeShifts->isEmpty()) {
            $this->info('No active shifts right now.');
            return 0;
        }

        $this->info('Checking for users who missed clock-in for the following active shifts:');
        foreach ($activeShifts as $shift) {
            $this->line("- Shift: {$shift->name} ({$shift->start_time} - {$shift->end_time}) for Profession: {$shift->profession->name}");

            // Find users who are assigned to this profession
            $users = User::where('profession_id', $shift->profession_id)->get();

            // Find users who have NOT clocked in today for this shift
            $clockedInUserIds = Attendance::where('shift_id', $shift->id)
                ->whereDate('clock_in', $today)
                ->pluck('user_id')
                ->toArray();

            $missingUsers = $users->whereNotIn('id', $clockedInUserIds);

            if ($missingUsers->isEmpty()) {
                $this->info('  > Everyone has clocked in.');
            } else {
                $this->warn('  > The following users have not clocked in:');
                foreach ($missingUsers as $user) {
                    $this->line("    - {$user->name} ({$user->email})");
                }
            }
        }

        return 0;
    }
}
