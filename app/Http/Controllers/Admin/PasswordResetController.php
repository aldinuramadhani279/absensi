<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PasswordResetRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PasswordResetController extends Controller
{
    public function index()
    {
        $requests = PasswordResetRequest::with('user')->where('status', 'pending')->latest()->get();
        return view('admin.password_resets.index', compact('requests'));
    }

    public function approve($id)
    {
        $resetRequest = PasswordResetRequest::with('user')->findOrFail($id);
        
        $user = $resetRequest->user;

        if ($user) {
            // Reset password to default and set force change flag
            $user->password = Hash::make('12345678');
            $user->must_change_password = true;
            $user->save();

            // Delete the request as it has been fulfilled
            $resetRequest->delete();

            return redirect()->route('admin.password-resets.index')->with('success', 'Kata sandi pengguna telah direset menjadi "12345678". Pengguna akan dipaksa menggantinya saat login.');
        }

        return redirect()->route('admin.password-resets.index')->with('error', 'Pengguna tidak ditemukan.');
    }
}
