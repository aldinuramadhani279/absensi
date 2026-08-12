<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Profession;
use App\Exports\AttendanceExport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $professions = Profession::all() ?? []; // Ensure not null

        // Jika start_date & end_date tidak ada di request, default ke hari ini
        $startDate = $request->input('start_date', now()->format('Y-m-d'));
        $endDate = $request->input('end_date', now()->format('Y-m-d'));

        // 1. Get Attendances
        $query = Attendance::with(['user.profession', 'shift']);

        if ($request->filled('profession_id') && $request->profession_id !== 'all') {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('profession_id', $request->profession_id);
            });
        }

        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        $attendances = $query->get();

        // 2. Get Travel Requests (Dinas)
        $trQuery = \App\Models\TravelRequest::where('status', 'approved')->with('user.profession');

        if ($request->filled('profession_id') && $request->profession_id !== 'all') {
            $trQuery->whereHas('user', function ($q) use ($request) {
                $q->where('profession_id', $request->profession_id);
            });
        }

        if ($startDate) {
            $trQuery->where('end_date', '>=', $startDate);
        }

        if ($endDate) {
            $trQuery->where('start_date', '<=', $endDate);
        }

        $travelRequests = $trQuery->get();

        // 3. Expand Travel Requests & Admin Leaves
        $dinasRows = collect();
        foreach ($travelRequests as $tr) {
            $start = \Carbon\Carbon::parse($tr->start_date);
            $end = \Carbon\Carbon::parse($tr->end_date);
            
            $reportStart = $startDate ? \Carbon\Carbon::parse($startDate) : $start;
            $reportEnd = $endDate ? \Carbon\Carbon::parse($endDate) : $end;

            $current = $start->copy();
            while ($current->lte($end)) {
                if ($current->gte($reportStart) && $current->lte($reportEnd)) {
                    $dinasRows->push([
                        'id' => 'dinas_' . $tr->id . '_' . $current->format('Y-m-d'),
                        'user_id' => $tr->user_id,
                        'user' => $tr->user,
                        'shift' => null,
                        'clock_in' => '-',
                        'clock_out' => '-',
                        'status' => 'Dinas Luar Kota',
                        'notes' => $tr->reason,
                        'created_at' => $current->format('Y-m-d 00:00:00'),
                        'ip_address' => '-',
                        'clock_in_ip' => '-',
                        'photo_in' => null,
                        'photo_out' => null
                    ]);
                }
                $current->addDay();
            }
        }

        // Expand Admin Leaves (Izin Dadakan)
        $adminLeavesQuery = \App\Models\AdminLeave::with('user.profession');
        if ($request->filled('profession_id') && $request->profession_id !== 'all') {
            $adminLeavesQuery->whereHas('user', function ($q) use ($request) {
                $q->where('profession_id', $request->profession_id);
            });
        }
        if ($startDate) {
            $adminLeavesQuery->where('end_date', '>=', $startDate);
        }
        if ($endDate) {
            $adminLeavesQuery->where('start_date', '<=', $endDate);
        }

        foreach ($adminLeavesQuery->get() as $al) {
            $start = \Carbon\Carbon::parse($al->start_date);
            $end = \Carbon\Carbon::parse($al->end_date);
            
            $reportStart = $startDate ? \Carbon\Carbon::parse($startDate) : $start;
            $reportEnd = $endDate ? \Carbon\Carbon::parse($endDate) : $end;

            $current = $start->copy();
            while ($current->lte($end)) {
                if ($current->gte($reportStart) && $current->lte($reportEnd)) {
                    $dinasRows->push([
                        'id' => 'admin_leave_' . $al->id . '_' . $current->format('Y-m-d'),
                        'user_id' => $al->user_id,
                        'user' => $al->user,
                        'shift' => null,
                        'clock_in' => '-',
                        'clock_out' => '-',
                        'status' => 'Izin (' . ucfirst($al->type) . ')',
                        'notes' => $al->notes ?? 'Izin diberikan oleh admin',
                        'created_at' => $current->format('Y-m-d 00:00:00'),
                        'ip_address' => '-',
                        'clock_in_ip' => '-',
                        'photo_in' => null,
                        'photo_out' => null
                    ]);
                }
                $current->addDay();
            }
        }

        // Map attendances to standard format
        $attendancesData = $attendances->map(function($att) {
            return [
                'id' => $att->id,
                'user_id' => $att->user_id,
                'user' => $att->user,
                'shift' => $att->shift,
                'custom_shift_start' => $att->custom_shift_start,
                'custom_shift_end' => $att->custom_shift_end,
                'clock_in' => $att->clock_in,
                'clock_out' => $att->clock_out,
                'status' => $att->is_auto_closed ? $att->status . ' (Auto-Closed)' : $att->status,
                'notes' => $att->notes,
                'created_at' => $att->created_at->format('Y-m-d H:i:s'),
                'ip_address' => $att->ip_address ?? $att->clock_in_ip,
                'clock_in_ip' => $att->clock_in_ip,
                'photo_in' => $att->photo_in,
                'photo_out' => $att->photo_out
            ];
        });

        $mergedAttendances = collect($attendancesData)->merge($dinasRows)->sortByDesc('created_at')->values()->all();

        // 4. Get active employees for Matrix view
        $usersQuery = \App\Models\User::where('is_admin', false)
            ->with('profession')
            ->orderBy('name', 'asc');

        if ($request->filled('profession_id') && $request->profession_id !== 'all') {
            $usersQuery->where('profession_id', $request->profession_id);
        }
        $users = $usersQuery->get();

        return Inertia::render('Admin/Reports/Index', [
            'professions' => $professions,
            'attendances' => $mergedAttendances,
            'users' => $users,
            'filters' => [
                'profession_id' => $request->profession_id ?? '',
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]
        ]);
    }

    public function export(Request $request)
    {
        return Excel::download(new AttendanceExport(
            $request->profession_id,
            $request->start_date,
            $request->end_date
        ), 'laporan-absensi-' . now()->format('Y-m-d') . '.xlsx');
    }

    public function exportMatrix(Request $request)
    {
        return Excel::download(new \App\Exports\MatrixAttendanceExport(
            $request->profession_id,
            $request->start_date,
            $request->end_date
        ), 'laporan-matriks-kalender-' . now()->format('Y-m-d') . '.xlsx');
    }
}
