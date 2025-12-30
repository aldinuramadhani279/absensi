<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Profession;
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
        // Get all users except admins, or just standard users. 
        // Assuming 'is_admin' false are employees.
        $employees = User::where('is_admin', false)
            ->with('profession')
            ->orderBy('created_at', 'desc')
            ->get();
            
        $professions = Profession::all();
        
        return Inertia::render('Admin/Employees/Index', [
            'employees' => $employees,
            'professions' => $professions
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'status' => 'required|in:pns,non-pns',
            'profession_id' => 'required|exists:professions,id', // Make sure profession exists
            'nip' => 'nullable|required_if:status,pns|string', // NIP required if PNS
            'employee_id' => 'nullable|string', 
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'status' => $validated['status'],
            'profession_id' => $validated['profession_id'],
            'nip' => $request->nip,
            'employee_id' => $request->employee_id,
            'is_admin' => false,
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
     */
    public function resetPassword(User $employee)
    {
        $employee->update([
            'password' => Hash::make('12345678'),
            'must_change_password' => true,
        ]);

        return redirect()->back()->with('success', 'Password berhasil direset menjadi 12345678.');
    }
}
