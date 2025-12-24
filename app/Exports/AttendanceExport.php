<?php

namespace App\Exports;

use App\Models\Attendance;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Carbon\Carbon;

class AttendanceExport implements FromCollection, WithHeadings, WithMapping
{
    protected $professionId;
    protected $startDate;
    protected $endDate;

    public function __construct($professionId, $startDate, $endDate)
    {
        $this->professionId = $professionId;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
    }

    /**
    * @return \Illuminate\Support\Collection
    */
    public function collection()
    {
        $query = Attendance::with(['user.profession', 'shift'])
            ->whereHas('user', function ($q) {
                if ($this->professionId) {
                    $q->where('profession_id', $this->professionId);
                }
            });

        if ($this->startDate) {
            $query->whereDate('clock_in', '>=', $this->startDate);
        }

        if ($this->endDate) {
            $query->whereDate('clock_in', '<=', $this->endDate);
        }

        return $query->get();
    }

    public function headings(): array
    {
        return [
            'Name',
            'Profession',
            'Date',
            'Clock In',
            'Clock Out',
            'Total Hours',
            'Status',
            'Notes',
        ];
    }

    public function map($attendance): array
    {
        $clockIn = Carbon::parse($attendance->clock_in);
        $clockOut = $attendance->clock_out ? Carbon::parse($attendance->clock_out) : null;
        $totalHours = $clockOut ? $clockIn->diffInHours($clockOut) : 'N/A';

        return [
            $attendance->user->name,
            $attendance->user->profession->name ?? 'N/A',
            $clockIn->format('Y-m-d'),
            $clockIn->format('H:i:s'),
            $clockOut ? $clockOut->format('H:i:s') : 'N/A',
            $totalHours,
            $attendance->status,
            $attendance->notes,
        ];
    }
}
