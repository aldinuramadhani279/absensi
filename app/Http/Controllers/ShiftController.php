<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use App\Models\Profession;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShiftController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $shifts = Shift::with('profession')->orderBy('created_at', 'desc')->get();
        $professions = Profession::all();
        
        return Inertia::render('Admin/Shifts/Index', [
            'shifts' => $shifts,
            'professions' => $professions
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'profession_id' => 'required|exists:professions,id',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
        ]);

        Shift::create($validated);

        return redirect()->back()->with('success', 'Shift berhasil ditambahkan.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Shift $shift)
    {
        $shift->delete();
        return redirect()->back()->with('success', 'Shift berhasil dihapus.');
    }
}
