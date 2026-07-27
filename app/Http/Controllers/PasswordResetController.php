<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PasswordResetRequest;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class PasswordResetController extends Controller
{
    // Request from public/login page (forgot password)
    public function store(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();

        // Cek request pending yang sudah ada
        $existing = PasswordResetRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Anda sudah memiliki permintaan reset password yang sedang diproses.'], 400);
        }

        // [FIX M-5] Hapus 'requested_at' — kolom tidak ada di schema, gunakan created_at saja
        PasswordResetRequest::create([
            'user_id' => $user->id,
            'status'  => 'pending',
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

        // [FIX M-5] Hapus 'requested_at' — kolom tidak ada di schema
        PasswordResetRequest::create([
            'user_id' => $user->id,
            'status'  => 'pending',
        ]);

        return response()->json(['message' => 'Permintaan reset password berhasil dikirim.']);
    }
}
