<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\PasswordResetRequest as PassReq;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class PasswordResetRequestController extends Controller
{
    // --- Methods for LOGGED-OUT users ---

    /**
     * Display the public form for password reset requests.
     */
    public function showPublicRequestForm()
    {
        return view('auth.passwords.request');
    }

    /**
     * Handle the submission from the public password reset request form.
     */
    public function submitPublicRequest(Request $request)
    {
        $request->validate(['email' => 'required|email|exists:users,email']);

        $user = User::where('email', $request->email)->first();

        // Check if there is already a pending request to avoid duplicates
        $existingRequest = PassReq::where('user_id', $user->id)
            ->where('status', 'pending')
            ->exists();

        if ($existingRequest) {
            return back()->with('error', 'Anda sudah memiliki permintaan reset kata sandi yang sedang diproses.');
        }

        PassReq::create([
            'user_id' => $user->id,
        ]);

        return redirect()->route('login')->with('success', 'Permintaan reset kata sandi telah dikirim. Harap tunggu persetujuan admin.');
    }


    // --- Methods for LOGGED-IN users ---

    /**
     * Display the form to force a password change after approval.
     */
    public function showForceChangeForm()
    {
        return view('auth.passwords.force_change');
    }

    /**
     * Handle the submission of the force password change form.
     */
    public function forceChangePassword(Request $request)
    {
        $request->validate([
            'password' => 'required|confirmed|min:8',
        ]);

        $user = Auth::user();
        
        // Update user's password and unset the force change flag
        $user->password = Hash::make($request->password);
        $user->must_change_password = false;
        $user->save();

        return redirect('/home')->with('success', 'Kata sandi Anda telah berhasil diubah.');
    }

    /**
     * Handle the user's request to reset their password from their profile.
     */
    public function requestFromProfile()
    {
        $user = Auth::user();

        // Check if there is already a pending request to avoid duplicates
        $existingRequest = PassReq::where('user_id', $user->id)
            ->where('status', 'pending')
            ->exists();

        if ($existingRequest) {
            return back()->with('error_password', 'Anda sudah memiliki permintaan reset kata sandi yang sedang diproses.');
        }

        PassReq::create([
            'user_id' => $user->id,
        ]);

        return back()->with('success_password', 'Permintaan ganti kata sandi telah dikirim ke admin.');
    }
}
