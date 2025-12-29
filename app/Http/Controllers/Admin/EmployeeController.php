<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Profession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EmployeeController extends Controller
{
    public function index()
    {
        $employees = User::where('is_admin', false)->with('profession')->latest()->get();
        return response()->json($employees);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'profession_id' => 'required|exists:professions,id',
            'status' => 'required|in:pns,non-pns',
            'nip' => 'nullable|required_if:status,pns|string|unique:users,nip',
        ]);

        $employee = null;
        DB::transaction(function () use ($validated, &$employee) {
            $employee_id = null;
            if ($validated['status'] == 'non-pns') {
                $lastEmployee = User::where('status', 'non-pns')
                                    ->orderByRaw('CAST(employee_id AS UNSIGNED) DESC')
                                    ->lockForUpdate()
                                    ->first();
                $employee_id = $lastEmployee ? (int)$lastEmployee->employee_id + 1 : 1;
            }
    
            $employee = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'profession_id' => $validated['profession_id'],
                'status' => $validated['status'],
                'nip' => $validated['nip'] ?? null,
                'employee_id' => $employee_id ? (string)$employee_id : null,
            ]);
        });

        // Load the profession relationship
        $employee->load('profession');

        return response()->json($employee, 201);
    }

    public function destroy(User $employee)
    {
        // Add authorization check if needed
        $employee->delete();
        return response()->json(null, 204);
    }

    public function resetPassword(User $employee)
    {
        $employee->password = Hash::make('12345678');
        $employee->must_change_password = true;
        $employee->save();

        return response()->json(['message' => 'Password for ' . $employee->name . ' has been reset successfully.']);
    }
}
