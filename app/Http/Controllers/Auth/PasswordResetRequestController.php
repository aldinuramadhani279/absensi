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

        if (PassReq::where('user_id', $user->id)->where('status', 'pending')->exists()) {
            return response()->json(['message' => 'Anda sudah memiliki permintaan reset kata sandi yang sedang diproses.'], 409);
        }

        PassReq::create(['user_id' => $user->id]);

        return response()->json(['message' => 'Permintaan reset kata sandi telah dikirim. Harap tunggu persetujuan admin.'], 201);
    }

    public function forceChangePassword(Request $request)
    {
        $request->validate(['password' => 'required|confirmed|min:8']);

        $user = Auth::user();
        $user->password = Hash::make($request->password);
        $user->must_change_password = false;
        $user->save();

        return response()->json(['message' => 'Kata sandi Anda telah berhasil diubah.']);
    }

    public function requestFromProfile()
    {
        $user = Auth::user();

        if (PassReq::where('user_id', $user->id)->where('status', 'pending')->exists()) {
            return response()->json(['message' => 'Anda sudah memiliki permintaan reset kata sandi yang sedang diproses.'], 409);
        }

        PassReq::create(['user_id' => $user->id]);

        return response()->json(['message' => 'Permintaan ganti kata sandi telah dikirim ke admin.'], 201);
    }
}
