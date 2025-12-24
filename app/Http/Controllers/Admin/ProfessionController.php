<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Profession;
use Illuminate\Http\Request;

class ProfessionController extends Controller
{
    public function index()
    {
        $professions = Profession::all();
        return view('admin.professions.index', compact('professions'));
    }

    public function create()
    {
        return view('admin.professions.create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:professions',
        ]);

        Profession::create($request->all());

        return redirect()->route('admin.professions.index')->with('success', 'Jabatan berhasil dibuat.');
    }
}
