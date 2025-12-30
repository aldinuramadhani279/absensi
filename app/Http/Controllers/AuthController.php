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
            'login' => ['required'], // Changed from email to login
            'password' => ['required'],
        ]);

        $loginType = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        // Attempt to log in
        if (Auth::attempt([$loginType => $request->login, 'password' => $request->password])) {
            $request->session()->regenerate();
            
            $user = Auth::user();
            
            // Check for force password change
            if ($user->must_change_password) {
                 return redirect()->intended('/password/force-change');
            }
            
            // Admin Logic
            if ($user->is_admin) {
                // Admins MUST login via Email
                if ($loginType !== 'email') {
                    Auth::logout();
                    $request->session()->invalidate();
                    return back()->withErrors([
                        'email' => 'Admin harus login menggunakan Email (@gmail.com).',
                    ])->onlyInput('login');
                }
                return redirect()->intended('/admin');
            } else {
                // Employees MUST login via Username
                if ($loginType !== 'username') {
                    Auth::logout();
                    $request->session()->invalidate();
                    return back()->withErrors([
                         'email' => 'Karyawan harus login menggunakan Username.',
                    ])->onlyInput('login');
                }
                return redirect()->intended('/home');
            }
        }

        return back()->withErrors([
            'email' => 'Kredensial yang diberikan tidak cocok dengan data kami.',
        ])->onlyInput('login');
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'profession_id' => 'required|exists:professions,id',
            'status' => 'required|in:pns,non-pns',
            'nip' => 'required_if:status,pns|nullable|string|max:255',
        ], [
            'nip.required_if' => 'NIP wajib diisi untuk status PNS.',
        ]);

        $user = \App\Models\User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'password' => \Illuminate\Support\Facades\Hash::make($validated['password']),
            'profession_id' => $validated['profession_id'],
            'status' => $validated['status'],
            'nip' => $validated['nip'],
            'is_admin' => false,
        ]);

        Auth::login($user);

        return redirect('/home');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/login');
    }
}
