<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function showLogin()
    {
        return Inertia::render('Auth/Login');
    }

    public function showRegister()
    {
        return Inertia::render('Auth/Register', [
            'professions' => \App\Models\Profession::all(['id', 'name']),
        ]);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        // Attempt to log in
        if (Auth::attempt(['email' => $request->email, 'password' => $request->password])) {
            $request->session()->regenerate();
            
            $user = Auth::user();
            
            // Check for force password change
            if ($user->must_change_password) {
                 return redirect()->intended('/password/force-change');
            }
            
            // Admin Logic
            if ($user->is_admin) {
                return redirect()->intended('/admin');
            } else {
                return redirect()->intended('/home');
            }
        }

        return back()->withErrors([
            'email' => 'Kredensial yang diberikan tidak cocok dengan data kami.',
        ])->onlyInput('email');
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'profession_id' => 'required|exists:professions,id',
            'status' => 'required|in:pns,non-pns,militer,pppk,pblu',
            'nip' => 'nullable|required_if:status,pns,pppk,militer|string|max:255',
        ], [
            'nip.required_if' => 'NIP atau NRP wajib diisi untuk status PNS, PPPK, atau Militer.',
        ]);

        $user = \App\Models\User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => \Illuminate\Support\Facades\Hash::make($validated['password']),
            'profession_id' => $validated['profession_id'],
            'status' => $validated['status'],
            'nip' => $validated['nip'],
            'is_admin' => false,
        ]);

        // Auth::login($user); // Disable auto-login to enforce IP check on login
        
        return redirect('/login')->with('success', 'Registrasi berhasil! Silakan login.');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/login');
    }
}
