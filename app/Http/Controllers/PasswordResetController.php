<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\PasswordResetRequest;
use App\Models\User;

class PasswordResetController extends Controller
{
    // Request from public/login page (forgot password)
    public function store(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();

        // Check for existing pending request
        $existing = PasswordResetRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Anda sudah memiliki permintaan reset password yang sedang diproses.'], 400);
        }

        PasswordResetRequest::create([
            'user_id' => $user->id,
            'status' => 'pending',
            'requested_at' => now(), // If column exists, otherwise created_at is fine
        ]);

        return response()->json(['message' => 'Permintaan reset password berhasil dikirim.']);
    }

    // Request from logged in profile
    public function storeFromProfile(Request $request)
    {
        $user = Auth::user();

        $existing = PasswordResetRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Anda sudah memiliki permintaan reset password yang sedang diproses.'], 400);
        }

        PasswordResetRequest::create([
            'user_id' => $user->id,
            'status' => 'pending',
            // 'requested_at' => now(), // if your model uses created_at by default, this is redundant but safe
        ]);

        return response()->json(['message' => 'Permintaan reset password berhasil dikirim.']);
    }
}
