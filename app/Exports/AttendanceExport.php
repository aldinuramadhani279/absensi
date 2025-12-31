<?php

namespace App\Exports;

use App\Models\Attendance;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

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
        // 1. Get Attendances
        $query = Attendance::with(['user.profession', 'shift']);

        if ($this->professionId) {
            $query->whereHas('user', function ($q) {
                $q->where('profession_id', $this->professionId);
            });
        }

        if ($this->startDate) {
            $query->whereDate('date', '>=', $this->startDate);
        }

        if ($this->endDate) {
            $query->whereDate('date', '<=', $this->endDate);
        }

        $attendances = $query->get();

        // 2. Get Travel Requests (Dinas)
        $trQuery = \App\Models\TravelRequest::where('status', 'approved')->with('user.profession');

        // Filter by profession if needed (indirectly via user)
        if ($this->professionId) {
             $trQuery->whereHas('user', function ($q) {
                $q->where('profession_id', $this->professionId);
            });
        }

        if ($this->startDate) {
            $trQuery->where('end_date', '>=', $this->startDate);
        }

        if ($this->endDate) {
            $trQuery->where('start_date', '<=', $this->endDate);
        }

        $travelRequests = $trQuery->get();

        // 3. Expand Travel Requests into daily "Attendance-like" objects
        $dinasRows = collect();
        foreach ($travelRequests as $tr) {
            // using Carbon to iterate
            $start = \Carbon\Carbon::parse($tr->start_date);
            $end = \Carbon\Carbon::parse($tr->end_date);
            
            // Adjust start/end to fit within report range if needed
            $reportStart = $this->startDate ? \Carbon\Carbon::parse($this->startDate) : $start;
            $reportEnd = $this->endDate ? \Carbon\Carbon::parse($this->endDate) : $end;

            // Iterate
            $current = $start->copy();
            while ($current->lte($end)) {
                // Only include if within report range
                if ($current->gte($reportStart) && $current->lte($reportEnd)) {
                    $dummy = new Attendance();
                    $dummy->user = $tr->user; // Manually assign relation
                    $dummy->date = $current->format('Y-m-d');
                    $dummy->clock_in = '-';
                    $dummy->clock_out = '-';
                    $dummy->status = 'Dinas Luar Kota';
                    $dummy->notes = $tr->reason;
                    // We can't easily assign shift unless we look it up, leave as null
                    
                    $dinasRows->push($dummy);
                }
                $current->addDay();
            }
        }

        // Merge and sort
        return $attendances->merge($dinasRows)->sortByDesc('date');
    }

    public function headings(): array
    {
        return [
            'Nama Karyawan',
            'Jabatan',
            'Shift',
            'Tanggal',
            'Jam Masuk',
            'Jam Keluar',
            'Status',
            'Catatan',
        ];
    }

    public function map($attendance): array
    {
        return [
            $attendance->user->name,
            $attendance->user->profession->name ?? '-',
            $attendance->shift->name ?? '-',
            $attendance->date,
            $attendance->clock_in,
            $attendance->clock_out,
            $attendance->status,
            $attendance->notes,
        ];
    }
}
