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
        $this->startDate    = $startDate;
        $this->endDate      = $endDate;
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
            $query->whereDate('created_at', '>=', $this->startDate);
        }

        if ($this->endDate) {
            $query->whereDate('created_at', '<=', $this->endDate);
        }

        $attendances = $query->get();

        // 2. Get Travel Requests (Dinas)
        $trQuery = \App\Models\TravelRequest::where('status', 'approved')->with('user.profession');

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
            $start = \Carbon\Carbon::parse($tr->start_date);
            $end   = \Carbon\Carbon::parse($tr->end_date);

            $reportStart = $this->startDate ? \Carbon\Carbon::parse($this->startDate) : $start;
            $reportEnd   = $this->endDate   ? \Carbon\Carbon::parse($this->endDate)   : $end;

            $current = $start->copy();
            while ($current->lte($end)) {
                if ($current->gte($reportStart) && $current->lte($reportEnd)) {
                    $dummy            = new Attendance();
                    $dummy->user      = $tr->user;
                    $dummy->date      = $current->format('Y-m-d');
                    // [FIX N-3] Gunakan null bukan string '-' agar tidak crash di Carbon::parse
                    $dummy->clock_in  = null;
                    $dummy->clock_out = null;
                    $dummy->status    = 'Dinas Luar Kota';
                    $dummy->notes     = $tr->reason;
                    $dummy->shift     = null;

                    $dinasRows->push($dummy);
                }
                $current->addDay();
            }
        }

        return $attendances->merge($dinasRows)->sortByDesc('date');
    }

    public function headings(): array
    {
        return [
            'Nama Karyawan',
            'Status Pegawai',
            'NIP / NRP / ID',
            'Jabatan',
            'Shift',
            'Tanggal',
            'Jam Masuk',
            'Jam Keluar',
            'Status Kehadiran',
            'Catatan',
        ];
    }

    public function map($attendance): array
    {
        // [FIX N-3] Tangani clock_in/clock_out null dengan aman — tidak crash jika null/string '-'
        $clockInFormatted  = null;
        $clockOutFormatted = null;
        $tanggal           = $attendance->date ?? null;

        if ($attendance->clock_in && $attendance->clock_in !== '-') {
            try {
                $parsedIn         = \Carbon\Carbon::parse($attendance->clock_in);
                $clockInFormatted  = $parsedIn->format('H:i:s');
                if (!$tanggal) {
                    $tanggal = $parsedIn->format('Y-m-d');
                }
            } catch (\Exception $e) {
                $clockInFormatted = '-';
            }
        } else {
            $clockInFormatted = '-';
        }

        if ($attendance->clock_out && $attendance->clock_out !== '-') {
            try {
                $clockOutFormatted = \Carbon\Carbon::parse($attendance->clock_out)->format('H:i:s');
            } catch (\Exception $e) {
                $clockOutFormatted = '-';
            }
        } else {
            $clockOutFormatted = '-';
        }

        return [
            $attendance->user->name                                             ?? '-',
            strtoupper($attendance->user->status                                ?? '-'),
            $attendance->user->nip ?? $attendance->user->employee_id            ?? '-',
            $attendance->user->profession->name                                  ?? '-',
            $attendance->shift->name                                             ?? '-',
            $tanggal                                                             ?? '-',
            $clockInFormatted,
            $clockOutFormatted,
            $attendance->status                                                  ?? '-',
            $attendance->notes                                                   ?? '-',
        ];
    }
}
