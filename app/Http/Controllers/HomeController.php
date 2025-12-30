<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class HomeController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        $attendance = \App\Models\Attendance::where('user_id', $user->id)
            ->whereDate('created_at', now()->today())
            ->first();

        // Get shifts (optionally filter by profession if your logic requires it)
        // For now, getting all shifts or shifts matching user's profession
        $shifts = \App\Models\Shift::all(); 
        
        $has_forgot_clock_out = \App\Models\Attendance::where('user_id', $user->id)
            ->whereNull('clock_out')
            ->whereDate('created_at', '<', now()->today())
            ->exists();
        
        return Inertia::render('User/Dashboard', [
            'auth' => [
                'user' => $user
            ],
            'attendance' => $attendance,
            'shifts' => $shifts,
            'has_forgot_clock_out' => $has_forgot_clock_out,
        ]);
    }
}
