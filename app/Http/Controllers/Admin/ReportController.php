<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Exports\AttendanceExport;
use App\Models\Profession;
use App\Models\Attendance;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'profession_id' => 'nullable|exists:professions,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        // Query for attendances based on filters
        $query = Attendance::with(['user.profession', 'shift'])
            ->whereHas('user', function ($q) use ($request) {
                if ($request->filled('profession_id')) {
                    $q->where('profession_id', $request->profession_id);
                }
            });

        if ($request->filled('start_date')) {
            $query->whereDate('clock_in', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('clock_in', '<=', $request->end_date);
        }

        $attendances = $query->latest('clock_in')->get();
        
        // We also need the list of professions for the filter dropdown
        $professions = Profession::all();

        return response()->json([
            'attendances' => $attendances,
            'professions' => $professions,
        ]);
    }

    public function export(Request $request)
    {
        $request->validate([
            'profession_id' => 'nullable|exists:professions,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $professionId = $request->input('profession_id');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        return Excel::download(new AttendanceExport($professionId, $startDate, $endDate), 'laporan_absensi.xlsx');
    }
}
