<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Exports\AttendanceExport;
use App\Models\Profession;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function index()
    {
        $professions = Profession::all();
        return view('admin.reports.index', compact('professions'));
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

        return Excel::download(new AttendanceExport($professionId, $startDate, $endDate), 'attendance.xlsx');
    }
}
