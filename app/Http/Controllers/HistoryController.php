<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Attendance;

class HistoryController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $history = Attendance::with('shift')
            ->where('user_id', $user->id)
            ->orderBy('clock_in', 'desc')
            ->paginate(10); // Simple pagination

        return Inertia::render('History/Index', [
            'history' => $history
        ]);
    }
}
