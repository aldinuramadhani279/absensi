<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\LeaveRequest;

class LeaveRequestController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $requests = LeaveRequest::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('LeaveRequests/Index', [
            'requests' => $requests
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string|max:255',
        ]);

        LeaveRequest::create([
            'user_id' => Auth::id(),
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'reason' => $request->reason,
            'status' => 'pending',
        ]);

        return redirect()->back()->with('success', 'Permintaan cuti berhasil diajukan.');
    }
}
