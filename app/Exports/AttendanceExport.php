<?php

namespace App\Exports;

use App\Models\Attendance;
use App\Models\User;
use App\Models\TravelRequest;
use App\Models\AdminLeave;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class AttendanceExport implements WithMultipleSheets
{
    protected $professionId;
    protected $startDate;
    protected $endDate;
    protected $roomId;

    public function __construct($professionId = null, $startDate = null, $endDate = null, $roomId = null)
    {
        $this->professionId = $professionId;
        $this->startDate    = $startDate;
        $this->endDate      = $endDate;
        $this->roomId       = $roomId;
    }

    public function sheets(): array
    {
        return [
            new MatrixAttendanceExport($this->professionId, $this->startDate, $this->endDate, $this->roomId),
            new RekapPerKaryawanSheet($this->professionId, $this->startDate, $this->endDate, $this->roomId),
            new DetailLogPresensiSheet($this->professionId, $this->startDate, $this->endDate, $this->roomId),
        ];
    }
}

/**
 * Sheet 2: Rekapitulasi Presensi per Karyawan (1 Baris = 1 Karyawan)
 */
class RekapPerKaryawanSheet implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize, WithStyles
{
    protected $professionId;
    protected $startDate;
    protected $endDate;
    protected $roomId;

    public function __construct($professionId = null, $startDate = null, $endDate = null, $roomId = null)
    {
        $this->professionId = $professionId;
        $this->startDate    = $startDate;
        $this->endDate      = $endDate;
        $this->roomId       = $roomId;
    }

    public function title(): string
    {
        return 'Rekap Presensi per Karyawan';
    }

    public function collection()
    {
        $usersQuery = User::where('is_admin', false)->with(['profession', 'room'])->orderBy('name', 'asc');

        if ($this->professionId && $this->professionId !== 'all') {
            $usersQuery->where('profession_id', $this->professionId);
        }

        if ($this->roomId && $this->roomId !== 'all') {
            $usersQuery->where('room_id', $this->roomId);
        }

        $users = $usersQuery->get();

        return $users->map(function ($user, $index) {
            $attQuery = Attendance::where('user_id', $user->id);
            if ($this->startDate) {
                $attQuery->whereDate('created_at', '>=', $this->startDate);
            }
            if ($this->endDate) {
                $attQuery->whereDate('created_at', '<=', $this->endDate);
            }
            $attendances = $attQuery->get();

            $totalHadir      = $attendances->count();
            $totalTepatWaktu = $attendances->where('status', 'tepat waktu')->where('is_auto_closed', false)->count();
            $totalTerlambat  = $attendances->where('status', 'terlambat')->count();
            $totalLupaClock  = $attendances->where('is_auto_closed', true)->count();

            // Count Travel & Admin Leaves
            $trQuery = TravelRequest::where('user_id', $user->id)->where('status', 'approved');
            if ($this->startDate) {
                $trQuery->where('end_date', '>=', $this->startDate);
            }
            if ($this->endDate) {
                $trQuery->where('start_date', '<=', $this->endDate);
            }
            $totalDinas = $trQuery->count();

            $alQuery = AdminLeave::where('user_id', $user->id);
            if ($this->startDate) {
                $alQuery->where('end_date', '>=', $this->startDate);
            }
            if ($this->endDate) {
                $alQuery->where('start_date', '<=', $this->endDate);
            }
            $totalLeave = $alQuery->count();

            return (object) [
                'no'                  => $index + 1,
                'name'                => $user->name,
                'status'              => strtoupper($user->status ?? '-'),
                'nip'                 => $user->nip ?? $user->employee_id ?? '-',
                'profession'          => $user->profession->name ?? '-',
                'room'                => $user->room->name ?? '-',
                'total_tepat_waktu'   => $totalTepatWaktu,
                'total_terlambat'     => $totalTerlambat,
                'total_dinas_cuti'    => $totalDinas + $totalLeave,
                'total_lupa_clockout' => $totalLupaClock,
                'total_hadir'         => $totalHadir,
            ];
        });
    }

    public function headings(): array
    {
        return [
            'No',
            'Nama Karyawan',
            'Status Pegawai',
            'NIP / NRP / ID',
            'Jabatan',
            'Ruangan',
            'Total Hadir (Tepat Waktu)',
            'Total Terlambat',
            'Total Cuti / Dinas',
            'Total Lupa Clock Out',
            'Total Presensi',
        ];
    }

    public function map($row): array
    {
        return [
            $row->no,
            $row->name,
            $row->status,
            $row->nip,
            $row->profession,
            $row->room,
            $row->total_tepat_waktu,
            $row->total_terlambat,
            $row->total_dinas_cuti,
            $row->total_lupa_clockout,
            $row->total_hadir,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // Header Row Styling (Row 1)
        $sheet->getStyle('A1:J1')->applyFromArray([
            'font' => [
                'bold'  => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size'  => 11,
            ],
            'fill' => [
                'fillType'   => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '1E3A8A'], // Navy Blue
            ],
            'alignment' => [
                'vertical'   => Alignment::VERTICAL_CENTER,
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);

        $sheet->getRowDimension(1)->setRowHeight(28);

        // Border Styling for Data Cells
        $highestRow = $sheet->getHighestRow();
        if ($highestRow > 1) {
            $sheet->getStyle("A1:J{$highestRow}")->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color'       => ['rgb' => 'D1D5DB'],
                    ],
                ],
            ]);
            // Center align No, Status, NIP, totals
            $sheet->getStyle("A2:A{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("C2:D{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("F2:J{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }

        return [];
    }
}

/**
 * Sheet 2: Detail Transaksi Log Presensi
 */
class DetailLogPresensiSheet implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize, WithStyles
{
    protected $professionId;
    protected $startDate;
    protected $endDate;
    protected $roomId;

    public function __construct($professionId = null, $startDate = null, $endDate = null, $roomId = null)
    {
        $this->professionId = $professionId;
        $this->startDate    = $startDate;
        $this->endDate      = $endDate;
        $this->roomId       = $roomId;
    }

    public function title(): string
    {
        return 'Rincian Detail Presensi';
    }

    public function collection()
    {
        $query = Attendance::with(['user.profession', 'user.room', 'shift']);

        if ($this->professionId && $this->professionId !== 'all') {
            $query->whereHas('user', function ($q) {
                $q->where('profession_id', $this->professionId);
            });
        }

        if ($this->roomId && $this->roomId !== 'all') {
            $query->whereHas('user', function ($q) {
                $q->where('room_id', $this->roomId);
            });
        }

        if ($this->startDate) {
            $query->whereDate('created_at', '>=', $this->startDate);
        }

        if ($this->endDate) {
            $query->whereDate('created_at', '<=', $this->endDate);
        }

        $attendances = $query->get();

        // Get Travel Requests (Dinas)
        $trQuery = TravelRequest::where('status', 'approved')->with(['user.profession', 'user.room']);
        if ($this->professionId && $this->professionId !== 'all') {
            $trQuery->whereHas('user', function ($q) {
                $q->where('profession_id', $this->professionId);
            });
        }
        if ($this->roomId && $this->roomId !== 'all') {
            $trQuery->whereHas('user', function ($q) {
                $q->where('room_id', $this->roomId);
            });
        }
        if ($this->startDate) {
            $trQuery->where('end_date', '>=', $this->startDate);
        }
        if ($this->endDate) {
            $trQuery->where('start_date', '<=', $this->endDate);
        }
        $travelRequests = $trQuery->get();

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

        return $attendances->merge($dinasRows)->sortBy([
            fn($a, $b) => strcmp($a->user->name ?? '', $b->user->name ?? ''),
            fn($a, $b) => strcmp($b->date ?? '', $a->date ?? ''),
        ]);
    }

    public function headings(): array
    {
        return [
            'Nama Karyawan',
            'Status Pegawai',
            'NIP / NRP / ID',
            'Jabatan',
            'Ruangan',
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

        $statusText = $attendance->status ?? '-';
        if ($attendance->is_auto_closed) {
            $statusText .= ' (Lupa Clock Out)';
        }

        return [
            $attendance->user->name                                    ?? '-',
            strtoupper($attendance->user->status                       ?? '-'),
            $attendance->user->nip ?? $attendance->user->employee_id   ?? '-',
            $attendance->user->profession->name                        ?? '-',
            $attendance->user->room->name                              ?? '-',
            $attendance->shift->name                                   ?? '-',
            $tanggal                                                   ?? '-',
            $clockInFormatted,
            $clockOutFormatted,
            $statusText,
            $attendance->notes                                         ?? '-',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // Header Row Styling (Row 1)
        $sheet->getStyle('A1:J1')->applyFromArray([
            'font' => [
                'bold'  => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size'  => 11,
            ],
            'fill' => [
                'fillType'   => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '0F172A'], // Slate 900
            ],
            'alignment' => [
                'vertical'   => Alignment::VERTICAL_CENTER,
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);

        $sheet->getRowDimension(1)->setRowHeight(28);

        $highestRow = $sheet->getHighestRow();
        if ($highestRow > 1) {
            $sheet->getStyle("A1:J{$highestRow}")->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color'       => ['rgb' => 'D1D5DB'],
                    ],
                ],
            ]);
            $sheet->getStyle("B2:C{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("F2:I{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }

        return [];
    }
}
