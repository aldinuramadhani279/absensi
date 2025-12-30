<?php

namespace App\Http\Controllers;

use App\Models\Profession;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProfessionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $professions = Profession::orderBy('created_at', 'desc')->get();
        return Inertia::render('Admin/Professions/Index', [
            'professions' => $professions
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:professions,name',
        ]);

        Profession::create($validated);

        return redirect()->back()->with('success', 'Jabatan berhasil ditambahkan.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Profession $profession)
    {
        $profession->delete();
        return redirect()->back()->with('success', 'Jabatan berhasil dihapus.');
    }
}
