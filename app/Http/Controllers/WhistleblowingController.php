<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Whistleblowing;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class WhistleblowingController extends Controller
{
    /**
     * For Admin: List all whistleblowing reports
     */
    public function index()
    {
        $reports = Whistleblowing::orderBy('created_at', 'desc')->get();
        return Inertia::render('Admin/Whistleblowing/Index', [
            'reports' => $reports
        ]);
    }

    /**
     * For User: Store a new anonymous whistleblowing report
     */
    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|string',
            'details' => 'required|string',
            'reported_name' => 'nullable|string',
            'photo_evidence' => 'nullable|image|max:10240', // 10MB max
        ]);

        $photoPath = null;
        if ($request->hasFile('photo_evidence')) {
            $photoPath = $request->file('photo_evidence')->store('whistleblowings', 'public');
        }

        Whistleblowing::create([
            'type' => $request->type,
            'details' => $request->details,
            'reported_name' => $request->reported_name,
            'photo_evidence' => $photoPath,
        ]);

        return redirect()->back()->with('message', 'Laporan berhasil dikirim dan dijamin kerahasiaannya.');
    }

    /**
     * Show public/anonymous whistleblowing form
     */
    public function showPublicForm($hash)
    {
        $secureHash = config('app.wbs_hash', 'a7d8e9f2b3c4');
        if ($hash !== $secureHash) {
            abort(404);
        }

        return Inertia::render('Public/WbsForm', [
            'hash' => $hash
        ]);
    }

    /**
     * Store a public/anonymous whistleblowing report
     */
    public function storePublic(Request $request, $hash)
    {
        $secureHash = config('app.wbs_hash', 'a7d8e9f2b3c4');
        if ($hash !== $secureHash) {
            abort(404);
        }

        $request->validate([
            'type' => 'required|string',
            'details' => 'required|string',
            'reported_name' => 'nullable|string',
            'photo_evidence' => 'nullable|image|max:10240', // 10MB max
        ]);

        $photoPath = null;
        if ($request->hasFile('photo_evidence')) {
            $photoPath = $request->file('photo_evidence')->store('whistleblowings', 'public');
        }

        Whistleblowing::create([
            'type' => $request->type,
            'details' => $request->details,
            'reported_name' => $request->reported_name,
            'photo_evidence' => $photoPath,
        ]);

        return redirect()->back()->with('message', 'Laporan berhasil dikirim dan dijamin kerahasiaannya.');
    }
}
