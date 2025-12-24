<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use Illuminate\Http\Request;

class LeaveRequestController extends Controller
{
    public function index()
    {
        $leaveRequests = LeaveRequest::with('user')->orderBy('created_at', 'desc')->get();
        return view('admin.leave_requests.index', compact('leaveRequests'));
    }

    public function update(Request $request, LeaveRequest $leaveRequest)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        $leaveRequest->update(['status' => $request->status]);

        return redirect()->route('admin.leave-requests.index')->with('success', 'Status permohonan cuti berhasil diperbarui.');
    }
}
