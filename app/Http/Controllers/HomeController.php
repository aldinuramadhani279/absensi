<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Attendance;
use App\Models\Shift;
use Carbon\Carbon;

class HomeController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        $user = Auth::user();
        $today = Carbon::today();

        $hasForgotClockOut = Attendance::where('user_id', $user->id)
            ->whereDate('clock_in', '<', $today)
            ->whereNull('clock_out')
            ->exists();

        $attendance = Attendance::with('shift')->where('user_id', $user->id)
            ->whereDate('clock_in', $today)
            ->first();

        $shifts = Shift::where('profession_id', $user->profession_id)->get();

        return response()->json([
            'user' => $user,
            'attendance' => $attendance,
            'shifts' => $shifts,
            'has_forgot_clock_out' => $hasForgotClockOut,
        ]);
    }

    /**
     * Show the user's attendance history.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function history()
    {
        $user = Auth::user();
        $attendances = Attendance::with('shift') // Eager load the shift relationship
            ->where('user_id', $user->id)
            ->latest('clock_in')
            ->paginate(15); // Paginate for long histories

        return response()->json($attendances);
    }
}
