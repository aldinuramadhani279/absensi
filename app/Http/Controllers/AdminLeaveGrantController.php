<?php

namespace App\Http\Controllers;

use App\Models\AdminLeave;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminLeaveGrantController extends Controller
{
    /**
     * Tampilkan halaman manajemen izin dadakan oleh admin.
     */
    public function index(Request $request)
    {
        $search = $request->input('search', '');

        $adminLeaves = AdminLeave::with(['user', 'grantedBy'])
            ->when($search, function ($q) use ($search) {
                $q->whereHas('user', function ($u) use ($search) {
                    $u->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderBy('start_date', 'desc')
            ->paginate(20)
            ->withQueryString();

        // Semua user non-admin untuk dropdown pencarian
        $users = User::where('is_admin', 0)
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return Inertia::render('Admin/AdminLeaves/Index', [
            'admin_leaves' => $adminLeaves,
            'users'        => $users,
            'filters'      => ['search' => $search],
        ]);
    }

    /**
     * Simpan izin baru yang diberikan admin.
     */
    public function store(Request $request)
    {
        $request->validate([
            'user_id'    => 'required|exists:users,id',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
            'type'       => 'required|in:sakit,cuti,izin_resmi,dinas_luar,lainnya',
            'notes'      => 'nullable|string|max:500',
        ]);

        AdminLeave::create([
            'user_id'    => $request->user_id,
            'start_date' => $request->start_date,
            'end_date'   => $request->end_date,
            'type'       => $request->type,
            'notes'      => $request->notes,
            'granted_by' => Auth::id(),
        ]);

        return back()->with('success', 'Izin berhasil diberikan kepada karyawan.');
    }

    /**
     * Batalkan/hapus izin yang sudah diberikan.
     */
    public function destroy(AdminLeave $adminLeave)
    {
        $adminLeave->delete();
        return back()->with('success', 'Izin berhasil dibatalkan.');
    }
}
