<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use App\Models\Profession;
use App\Models\EmploymentStatus;

class ProfileController extends Controller
{
    /**
     * Tampilkan halaman profil karyawan.
     */
    public function index()
    {
        $user               = Auth::user()->load('profession');
        $professions        = Profession::orderBy('name')->get(['id', 'name']);
        $employmentStatuses = EmploymentStatus::orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('User/Profile', [
            'user'               => $user,
            'professions'        => $professions,
            'employmentStatuses' => $employmentStatuses,
        ]);
    }

    /**
     * Update data profil karyawan.
     * Karyawan hanya bisa mengubah: nama, profesi, NIP, dan foto profil (jika ada).
     */
    public function update(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'profession_id' => 'required|exists:professions,id',
            'status'        => 'required|string|max:255',
            'nip'           => 'nullable|string|max:255',
            'employee_id'   => 'nullable|string|max:255',
        ]);

        $user->update([
            'name'          => $validated['name'],
            'profession_id' => $validated['profession_id'],
            'status'        => $validated['status'],
            'nip'           => $validated['nip'] ?? null,
            'employee_id'   => $validated['employee_id'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Profil berhasil diperbarui.');
    }

    /**
     * Update password dari halaman profil.
     */
    public function updatePassword(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ], [
            'password.confirmed' => 'Konfirmasi password baru tidak cocok.',
            'password.min'       => 'Password baru minimal 8 karakter.',
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Password saat ini tidak benar.'], 422);
        }

        $user->update([
            'password'            => Hash::make($request->password),
            'must_change_password' => false,
        ]);

        return response()->json(['message' => 'Password berhasil diperbarui.']);
    }
}
