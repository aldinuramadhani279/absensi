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
        $professions = Profession::all();
        
        $attendances = [];
        
        // If filters are present, load data, otherwise empty or load latest
        if ($request->hasAny(['profession_id', 'start_date', 'end_date'])) {
            $query = Attendance::with(['user.profession', 'shift'])
                ->orderBy('date', 'desc')
                ->orderBy('clock_in', 'desc');

            if ($request->filled('profession_id')) {
                $query->whereHas('user', function ($q) use ($request) {
                    $q->where('profession_id', $request->profession_id);
                });
            }

            if ($request->filled('start_date')) {
                $query->whereDate('date', '>=', $request->start_date);
            }

            if ($request->filled('end_date')) {
                $query->whereDate('date', '<=', $request->end_date);
            }
            
            $attendances = $query->get();
        }

        return Inertia::render('Admin/Reports/Index', [
            'professions' => $professions,
            'attendances' => $attendances,
            'filters' => $request->only(['profession_id', 'start_date', 'end_date'])
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
}
