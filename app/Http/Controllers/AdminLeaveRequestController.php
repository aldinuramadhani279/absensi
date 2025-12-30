<?php

namespace App\Http\Controllers;

use App\Models\LeaveRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminLeaveRequestController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $requests = LeaveRequest::with('user')
            ->orderByRaw("FIELD(status, 'pending', 'approved', 'rejected')")
            ->orderBy('created_at', 'desc')
            ->get();
            
        return Inertia::render('Admin/LeaveRequests/Index', [
            'requests' => $requests
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, LeaveRequest $leaveRequest)
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        $leaveRequest->update([
            'status' => $validated['status']
        ]);

        return redirect()->back()->with('success', 'Status pengajuan cuti berhasil diperbarui.');
    }
}
