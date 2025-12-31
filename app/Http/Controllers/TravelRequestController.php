<?php

namespace App\Http\Controllers;

use App\Models\TravelRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class TravelRequestController extends Controller
{
    public function index()
    {
        $requests = TravelRequest::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('TravelRequests/Index', [
            'requests' => $requests
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string',
            'attachment' => 'required|file|mimes:pdf,jpg,jpeg,png|max:2048', // Surat Tugas
        ]);

        $path = null;
        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('travel_attachments', 'public');
        }

        TravelRequest::create([
            'user_id' => Auth::id(),
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'reason' => $request->reason,
            'attachment_path' => $path,
            'status' => 'pending',
        ]);

        return redirect()->back()->with('success', 'Permintaan dinas luar kota berhasil diajukan.');
    }
}
