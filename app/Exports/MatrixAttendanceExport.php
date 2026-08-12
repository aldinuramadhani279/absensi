<?php

namespace App\Exports;

use App\Models\Attendance;
use App\Models\User;
use App\Models\TravelRequest;
use App\Models\AdminLeave;
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
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class MatrixAttendanceExport implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize, WithStyles
{
    protected $professionId;
    protected $startDate;
    protected $endDate;
    protected $dates = [];
    protected $cellColors = [];

    public function __construct($professionId, $startDate, $endDate)
    {
        $this->professionId = $professionId;
        $this->startDate    = $startDate ?: now()->startOfMonth()->format('Y-m-d');
        $this->endDate      = $endDate ?: now()->endOfMonth()->format('Y-m-d');

        // Build array of dates
        $start = Carbon::parse($this->startDate);
        $end   = Carbon::parse($this->endDate);

        // Limit date range to max 31 days per export
        if ($start->diffInDays($end) > 31) {
            $end = $start->copy()->addDays(30);
        }

        $period = CarbonPeriod::create($start, $end);
        foreach ($period as $date) {
            $this->dates[] = $date->format('Y-m-d');
        }
    }

    public function title(): string
    {
        return 'Matriks Presensi Kalender';
    }

    public function headings(): array
    {
        $dateHeadings = array_map(function ($d) {
            return Carbon::parse($d)->format('d/m/y');
        }, $this->dates);

        return array_merge([
            'No',
            'Nama Karyawan',
            'Status Pegawai',
            'NIP / NRP / ID',
            'Jabatan',
        ], $dateHeadings, [
            'Total Hadir',
            'Total Terlambat',
            'Total Cuti / Dinas',
        ]);
    }

    public function collection()
    {
        $usersQuery = User::where('is_admin', false)->with('profession')->orderBy('name', 'asc');

        if ($this->professionId && $this->professionId !== 'all') {
            $usersQuery->where('profession_id', $this->professionId);
        }

        $users = $usersQuery->get();

        // Fetch attendances for all users in date range
        $attendances = Attendance::whereIn('user_id', $users->pluck('id'))
            ->whereDate('created_at', '>=', $this->startDate)
            ->whereDate('created_at', '<=', $this->endDate)
            ->with('shift')
            ->get()
            ->groupBy(function ($item) {
                $dateStr = $item->date ?: Carbon::parse($item->created_at)->format('Y-m-d');
                return $item->user_id . '_' . $dateStr;
            });

        // Fetch Travel Requests
        $travelRequests = TravelRequest::whereIn('user_id', $users->pluck('id'))
            ->where('status', 'approved')
            ->where('end_date', '>=', $this->startDate)
            ->where('start_date', '<=', $this->endDate)
            ->get();

        // Fetch Admin Leaves
        $adminLeaves = AdminLeave::whereIn('user_id', $users->pluck('id'))
            ->where('end_date', '>=', $this->startDate)
            ->where('start_date', '<=', $this->endDate)
            ->get();

        $rows = collect();

        foreach ($users as $rowIndex => $user) {
            $rowNum = $rowIndex + 2; // Row 1 is headings
            $row = [
                'no'         => $rowIndex + 1,
                'name'       => $user->name,
                'status'     => strtoupper($user->status ?? '-'),
                'nip'        => $user->nip ?? $user->employee_id ?? '-',
                'profession' => $user->profession->name ?? '-',
            ];

            $totalHadir     = 0;
            $totalTerlambat = 0;
            $totalCutiDinas = 0;

            foreach ($this->dates as $dateIndex => $dateStr) {
                $colIndex = 6 + $dateIndex; // Column F is index 6
                $cellCoord = Coordinate::stringFromColumnIndex($colIndex) . $rowNum;

                $key = $user->id . '_' . $dateStr;

                if (isset($attendances[$key])) {
                    $att = $attendances[$key]->first();
                    $inTime  = $att->clock_in ? Carbon::parse($att->clock_in)->format('H:i') : '-';
                    $outTime = $att->clock_out ? Carbon::parse($att->clock_out)->format('H:i') : ($att->is_auto_closed ? '(Lupa)' : '-');

                    $cellText = "{$inTime} - {$outTime}";
                    $row[$dateStr] = $cellText;
                    $totalHadir++;

                    $isCustomShift = ($att->shift && str_contains(strtolower($att->shift->name), 'custom')) || !empty($att->custom_shift_start);

                    if ($isCustomShift) {
                        // PINK for Custom Shift
                        $this->cellColors[$cellCoord] = [
                            'bg'   => 'FCE7F3', // Light Pink
                            'font' => '9D174D', // Dark Pink Text
                        ];
                    } elseif ($att->status === 'terlambat') {
                        // RED for Late
                        $totalTerlambat++;
                        $this->cellColors[$cellCoord] = [
                            'bg'   => 'FEE2E2', // Light Red
                            'font' => '991B1B', // Dark Red Text
                        ];
                    } elseif ($att->status === 'early' || $att->status_code === 'early') {
                        // BLUE for Early
                        $this->cellColors[$cellCoord] = [
                            'bg'   => 'DBEAFE', // Light Blue
                            'font' => '1E40AF', // Dark Blue Text
                        ];
                    } else {
                        // GREEN for Ontime
                        $this->cellColors[$cellCoord] = [
                            'bg'   => 'DCFCE7', // Light Green
                            'font' => '166534', // Dark Green Text
                        ];
                    }
                } else {
                    // Check Dinas / Cuti
                    $isDinas = $travelRequests->first(function ($tr) use ($user, $dateStr) {
                        return $tr->user_id == $user->id && $dateStr >= $tr->start_date && $dateStr <= $tr->end_date;
                    });
                    $isLeave = $adminLeaves->first(function ($al) use ($user, $dateStr) {
                        return $al->user_id == $user->id && $dateStr >= $al->start_date && $dateStr <= $al->end_date;
                    });

                    if ($isDinas || $isLeave) {
                        $totalCutiDinas++;
                        $row[$dateStr] = $isDinas ? 'Dinas' : 'Izin/Cuti';
                        // AMBER for Leave / Travel
                        $this->cellColors[$cellCoord] = [
                            'bg'   => 'FEF3C7', // Light Amber
                            'font' => '92400E', // Dark Amber Text
                        ];
                    } else {
                        $row[$dateStr] = '-';
                    }
                }
            }

            $row['total_hadir']     = $totalHadir;
            $row['total_terlambat'] = $totalTerlambat;
            $row['total_cuti_dinas'] = $totalCutiDinas;

            $rows->push($row);
        }

        return $rows;
    }

    public function map($row): array
    {
        return array_values((array) $row);
    }

    public function styles(Worksheet $sheet)
    {
        $totalCols = 5 + count($this->dates) + 3;
        $lastColLetter = Coordinate::stringFromColumnIndex($totalCols);

        // Header Styling
        $sheet->getStyle("A1:{$lastColLetter}1")->applyFromArray([
            'font' => [
                'bold'  => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size'  => 10,
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

        $sheet->getRowDimension(1)->setRowHeight(30);

        $highestRow = $sheet->getHighestRow();

        // Apply grid borders
        if ($highestRow > 1) {
            $sheet->getStyle("A1:{$lastColLetter}{$highestRow}")->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color'       => ['rgb' => 'D1D5DB'],
                    ],
                ],
            ]);

            // Alignment
            $sheet->getStyle("A2:A{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("C2:D{$highestRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $firstDateCol = Coordinate::stringFromColumnIndex(6);
            $sheet->getStyle("{$firstDateCol}2:{$lastColLetter}{$highestRow}")
                ->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                ->setVertical(Alignment::VERTICAL_CENTER);
        }

        // Apply dynamic cell colors for attendance statuses!
        foreach ($this->cellColors as $cellCoord => $colorData) {
            $sheet->getStyle($cellCoord)->applyFromArray([
                'font' => [
                    'bold'  => true,
                    'color' => ['rgb' => $colorData['font']],
                    'size'  => 9,
                ],
                'fill' => [
                    'fillType'   => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => $colorData['bg']],
                ],
            ]);
        }

        return [];
    }
}
