<?php

namespace App\Http\Controllers;

use App\Models\LeaveRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

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

    /**
     * Upload surat jalan for approved leave request.
     */
    public function uploadSurat(Request $request, LeaveRequest $leaveRequest)
    {
        $request->validate([
            'admin_attachment' => 'required|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        if ($leaveRequest->admin_attachment_path) {
            Storage::disk('public')->delete($leaveRequest->admin_attachment_path);
        }
        
        $path = $request->file('admin_attachment')->store('leave_attachments', 'public');
        
        $leaveRequest->update([
            'admin_attachment_path' => $path
        ]);

        return redirect()->back()->with('success', 'Surat Jalan berhasil diunggah.');
    }
}
