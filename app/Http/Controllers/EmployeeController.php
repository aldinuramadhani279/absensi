<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Profession;
use App\Models\EmploymentStatus;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = User::where('is_admin', false)
            ->with(['profession', 'room'])
            ->orderBy('name', 'asc');

        if ($request->filled('profession_id') && $request->profession_id !== 'all') {
            $query->where('profession_id', $request->profession_id);
        }

        if ($request->filled('room_id') && $request->room_id !== 'all') {
            $query->where('room_id', $request->room_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('nip', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Fast paginated collection for smooth performance
        $employees = $query->paginate(15)->withQueryString();

        $professions = Profession::orderBy('name')->get();
        $employmentStatuses = EmploymentStatus::orderBy('name')->get();
        $rooms = Room::orderBy('name')->get();

        return Inertia::render('Admin/Employees/Index', [
            'employees'          => $employees,
            'professions'        => $professions,
            'employmentStatuses' => $employmentStatuses,
            'rooms'              => $rooms,
            'filters'            => [
                'profession_id' => $request->profession_id ?? '',
                'room_id'       => $request->room_id ?? '',
                'search'        => $request->search ?? '',
            ],
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
            'room_id'       => 'nullable|exists:rooms,id',
            'nip'           => 'nullable|string',
            'employee_id'   => 'nullable|string',
        ]);

        User::create([
            'name'          => $validated['name'],
            'email'         => $validated['email'],
            'password'      => Hash::make($validated['password']),
            'status'        => $validated['status'],
            'profession_id' => $validated['profession_id'],
            'room_id'       => $validated['room_id'] ?? null,
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
