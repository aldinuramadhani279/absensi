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

        return $query->get();
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
