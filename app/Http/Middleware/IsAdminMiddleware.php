<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class IsAdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        if (!Auth::user()->is_admin) {
            // Hapus url.intended agar session tidak terjebak mengarahkan kembali ke /admin
            $request->session()->forget('url.intended');

            // Redirect user biasa ke dashboard mereka (/home) dengan pesan error flash
            return redirect('/home')->with('error', 'Anda tidak memiliki akses ke halaman Admin.');
        }

        return $next($request);
    }
}
