<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use App\Models\Profession;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    public function index()
    {
        $shifts = Shift::with('profession')->latest()->get();
        return response()->json($shifts);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'profession_id' => 'required|exists:professions,id',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ]);

        $shift = Shift::create($validated);
        // Load the profession relationship to include it in the response
        $shift->load('profession');

        return response()->json($shift, 201);
    }
}
