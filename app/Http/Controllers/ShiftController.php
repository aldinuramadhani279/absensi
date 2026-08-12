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
        $shifts = Shift::with('profession')
            ->orderBy('profession_id')
            ->orderBy('start_time')
            ->get();
        $professions = Profession::all();
        
        return Inertia::render('Admin/Shifts/Index', [
            'shifts' => $shifts,
            'professions' => $professions
        ]);
    }

    /**
     * Store a newly created resource in storage.
     * Supports bulk creation for multiple profession_ids at once.
     */
    public function store(Request $request)
    {
        $isCustom = str_contains(strtolower($request->name ?? ''), 'custom');

        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'profession_ids'   => 'required|array|min:1',
            'profession_ids.*' => 'exists:professions,id',
            'start_time'       => $isCustom ? 'nullable|date_format:H:i' : 'required|date_format:H:i',
            'end_time'         => $isCustom ? 'nullable|date_format:H:i' : 'required|date_format:H:i',
        ]);

        foreach ($validated['profession_ids'] as $professionId) {
            Shift::create([
                'name'          => $validated['name'],
                'profession_id' => $professionId,
                'start_time'    => $validated['start_time'] ?? '00:00',
                'end_time'      => $validated['end_time'] ?? '23:59',
            ]);
        }

        return redirect()->back()->with('success', 'Shift berhasil ditambahkan ke ' . count($validated['profession_ids']) . ' jabatan.');
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
