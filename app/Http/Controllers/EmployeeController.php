<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Profession;
use App\Models\EmploymentStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $employees = User::where('is_admin', false)
            ->with('profession')
            ->orderBy('created_at', 'desc')
            ->get();

        $professions = Profession::all();
        $employmentStatuses = EmploymentStatus::orderBy('name')->get();

        return Inertia::render('Admin/Employees/Index', [
            'employees'          => $employees,
            'professions'        => $professions,
            'employmentStatuses' => $employmentStatuses,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|string|email|max:255|unique:users',
            'password'      => 'required|string|min:8',
            'status'        => 'required|string|max:255',
            'profession_id' => 'required|exists:professions,id',
            'nip'           => 'nullable|string',
            'employee_id'   => 'nullable|string',
        ]);

        User::create([
            'name'          => $validated['name'],
            'email'         => $validated['email'],
            'password'      => Hash::make($validated['password']),
            'status'        => $validated['status'],
            'profession_id' => $validated['profession_id'],
            'nip'           => $request->nip,
            'employee_id'   => $request->employee_id,
            'is_admin'      => false,
        ]);

        return redirect()->back()->with('success', 'Karyawan berhasil ditambahkan.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $employee)
    {
        $employee->delete();
        return redirect()->back()->with('success', 'Data karyawan berhasil dihapus.');
    }

    /**
     * Reset the password for the specified employee.
     * [FIX N-4] Password default diambil dari config/env
     */
    public function resetPassword(User $employee)
    {
        $defaultPassword = config('app.reset_password_default', '12345678');

        $employee->update([
            'password'            => Hash::make($defaultPassword),
            'must_change_password' => true,
        ]);

        return redirect()->back()->with('success', "Password berhasil direset menjadi {$defaultPassword}.");
    }
}
