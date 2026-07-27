<?php

namespace App\Http\Controllers;

use App\Models\EmploymentStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class EmploymentStatusController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $statuses = EmploymentStatus::orderBy('created_at', 'desc')->get();
        return Inertia::render('Admin/EmploymentStatuses/Index', [
            'statuses' => $statuses
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:employment_statuses,name',
        ], [
            'name.required' => 'Nama status kepegawaian wajib diisi.',
            'name.unique'   => 'Nama status kepegawaian sudah ada.',
        ]);

        $code = Str::slug($validated['name']);

        EmploymentStatus::create([
            'name' => $validated['name'],
            'code' => $code,
        ]);

        return redirect()->back()->with('success', 'Status Kepegawaian berhasil ditambahkan.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(EmploymentStatus $employmentStatus)
    {
        $employmentStatus->delete();
        return redirect()->back()->with('success', 'Status Kepegawaian berhasil dihapus.');
    }
}
