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
        $employees = User::where('is_admin', false)->with('profession')->get();
        return view('admin.employees.index', compact('employees'));
    }

    public function create()
    {
        $professions = Profession::all();
        return view('admin.employees.create', compact('professions'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'profession_id' => 'required|exists:professions,id',
            'status' => 'required|in:pns,non-pns',
            'nip' => 'nullable|required_if:status,pns|string',
        ]);

        DB::transaction(function () use ($request) {
            $employee_id = null;
            if ($request->status == 'non-pns') {
                // As per the prompt, "mendapatkan sebuah nomor random acak dari system urut aja dari 1 hingga seterusnya"
                // This means a sequential number. We'll find the max `employee_id` and add 1.
                $lastEmployee = User::where('status', 'non-pns')
                                    ->orderBy('employee_id', 'desc')
                                    ->lockForUpdate() // Kunci baris untuk mencegah race condition
                                    ->first();
                $employee_id = $lastEmployee ? (int)$lastEmployee->employee_id + 1 : 1;
            }
    
            User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'profession_id' => $request->profession_id,
                'status' => $request->status,
                'nip' => $request->nip,
                'employee_id' => (string)$employee_id,
            ]);
        });

        return redirect()->route('admin.employees.index')->with('success', 'Karyawan berhasil dibuat.');
    }

    public function destroy(User $employee)
    {
        $employee->delete();
        return redirect()->route('admin.employees.index')->with('success', 'Karyawan berhasil dihapus.');
    }

    public function resetPassword(User $employee)
    {
        $newPassword = Str::random(8);
        $employee->password = Hash::make($newPassword);
        $employee->save();

        return redirect()->route('admin.employees.index')->with('success', 'Kata sandi untuk ' . $employee->name . ' telah berhasil diatur ulang.');
    }
}
