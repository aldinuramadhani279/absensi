<?php

namespace App\Http\Controllers;

use App\Models\TravelRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminTravelRequestController extends Controller
{
    public function index()
    {
        $requests = TravelRequest::with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Admin/TravelRequests/Index', [
            'requests' => $requests
        ]);
    }

    public function update(Request $request, TravelRequest $travelRequest)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        $travelRequest->update([
            'status' => $request->status,
            'approved_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', 'Status permintaan dinas berhasil diperbarui.');
    }
}
