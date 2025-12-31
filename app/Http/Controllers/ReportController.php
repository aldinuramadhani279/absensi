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
        
        $attendances = []; // Default empty array

        $query = Attendance::with(['user.profession', 'shift']) // Eager load
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($request->filled('profession_id') && $request->profession_id !== 'all') {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('profession_id', $request->profession_id);
            });
        }

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Limit to 50 if no filter to prevent overload, or get all if filtered
        if (!$request->hasAny(['profession_id', 'start_date', 'end_date'])) {
            $attendances = $query->take(50)->get();
        } else {
            $attendances = $query->get();
        }

        return Inertia::render('Admin/Reports/Index', [
            'professions' => $professions,
            'attendances' => $attendances,
            'filters' => $request->only(['profession_id', 'start_date', 'end_date']) ?? [], // Ensure not null
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
