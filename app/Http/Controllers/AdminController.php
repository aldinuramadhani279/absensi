<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function index()
    {
        $requests = \App\Models\PasswordResetRequest::with('user')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($request) {
                return [
                    'id' => $request->id,
                    'user_name' => $request->user->name,
                    'user_email' => $request->user->email,
                    'user_nip' => $request->user->nip,
                    'user_employee_id' => $request->user->employee_id,
                    'requested_at' => $request->created_at->toIso8601String(),
                    'status' => $request->status,
                ];
            });

        return Inertia::render('Admin/Dashboard', [
            'requests' => $requests
        ]);
    }

    public function getPasswordResets()
    {
        $requests = \App\Models\PasswordResetRequest::with('user')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($request) {
                return [
                    'id' => $request->id,
                    'user_name' => $request->user->name,
                    'user_email' => $request->user->email,
                    'user_nip' => $request->user->nip,
                    'user_employee_id' => $request->user->employee_id,
                    'requested_at' => $request->created_at->toIso8601String(),
                    'status' => $request->status,
                ];
            });

        return response()->json(['requests' => $requests]);
    }

    public function approvePasswordReset($id)
    {
        $request = \App\Models\PasswordResetRequest::findOrFail($id);
        
        if ($request->status !== 'pending') {
             return response()->json(['message' => 'Request already processed'], 400);
        }

        $user = $request->user;
        $user->password = \Illuminate\Support\Facades\Hash::make('12345678');
        $user->must_change_password = true;
        $user->save();

        $request->status = 'approved';
        $request->approved_at = now();
        $request->save();
        
        return response()->json(['message' => 'Success']);
    }
}
