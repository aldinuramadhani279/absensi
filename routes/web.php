<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\AdminController;

Route::get('/', function () {
    return redirect('/login');
});

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [AuthController::class, 'register']);
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    Route::get('/home', [HomeController::class, 'index'])->name('home');
    Route::get('/profile', [App\Http\Controllers\ProfileController::class, 'index'])->name('profile.index');
    Route::post('/profile', [App\Http\Controllers\ProfileController::class, 'update'])->name('profile.update');
    Route::get('/history', [App\Http\Controllers\HistoryController::class, 'index'])->name('history.index');
    Route::get('/leave-requests', [App\Http\Controllers\LeaveRequestController::class, 'index'])->name('leave-requests.index');
    Route::post('/leave-requests', [App\Http\Controllers\LeaveRequestController::class, 'store'])->name('leave-requests.store');

    // [FIX BUG #1] Route paksa ganti password setelah admin reset password
    Route::get('/password/force-change', [App\Http\Controllers\ProfileController::class, 'showForceChange'])->name('password.force-change');
    Route::post('/password/force-change', [App\Http\Controllers\ProfileController::class, 'forceChange'])->name('password.force-change.update');

    Route::get('/travel-requests', [App\Http\Controllers\TravelRequestController::class, 'index'])->name('travel-requests.index');
    Route::post('/travel-requests', [App\Http\Controllers\TravelRequestController::class, 'store'])->name('travel-requests.store');

    Route::post('/whistleblowing', [\App\Http\Controllers\WhistleblowingController::class, 'store'])->name('whistleblowing.store');

    // [C-3] Route admin dashboard sekarang juga pakai middleware is.admin
    Route::get('/admin', [AdminController::class, 'index'])->middleware('is.admin')->name('admin.dashboard');
});

// API routes — dipanggil via axios dari frontend
Route::prefix('api')->group(function () {

    // Public API
    Route::post('/password/request', [App\Http\Controllers\PasswordResetController::class, 'store']);

    Route::middleware('auth')->group(function () {
        Route::post('/clockin', [App\Http\Controllers\AttendanceController::class, 'clockIn']);
        Route::post('/clockout', [App\Http\Controllers\AttendanceController::class, 'clockOut']);
        Route::post('/forgot-clockout', [App\Http\Controllers\AttendanceController::class, 'forgotClockOut']);
        // [N-1] Endpoint ganti shift setelah clock out
        Route::post('/shift-change', [App\Http\Controllers\AttendanceController::class, 'changeShift']);
        // Profil password update
        Route::post('/profile/password', [App\Http\Controllers\ProfileController::class, 'updatePassword']);

        Route::post('/password/request-from-profile', [App\Http\Controllers\PasswordResetController::class, 'storeFromProfile']);

        Route::prefix('admin')->group(function () {
            Route::get('password-resets', [AdminController::class, 'getPasswordResets']);
            Route::post('password-resets/{id}/approve', [AdminController::class, 'approvePasswordReset']);
        });
    });
});


// [C-3] Semua route admin sekarang dilindungi oleh middleware is.admin
Route::middleware(['auth', 'is.admin'])->prefix('admin')->group(function () {
    Route::post('prune-photos', [\App\Http\Controllers\AdminController::class, 'prunePhotos'])->name('admin.prune-photos');
    Route::post('toggle-duplicate-ip', [\App\Http\Controllers\AdminController::class, 'toggleDuplicateIp'])->name('admin.toggle-duplicate-ip');
    Route::post('update-late-tolerance', [\App\Http\Controllers\AdminController::class, 'updateLateTolerance'])->name('admin.update-late-tolerance');

    // Resource routes for master data
    Route::resource('rooms', App\Http\Controllers\RoomController::class)->except(['create', 'edit', 'show']);
    Route::resource('professions', App\Http\Controllers\ProfessionController::class)->except(['create', 'edit', 'show', 'update']);
    Route::resource('employment-statuses', App\Http\Controllers\EmploymentStatusController::class)->except(['create', 'edit', 'show', 'update']);
    Route::resource('shifts', App\Http\Controllers\ShiftController::class)->except(['create', 'edit', 'show', 'update']);

    Route::resource('employees', App\Http\Controllers\EmployeeController::class)->except(['create', 'edit', 'show', 'update']);
    Route::post('employees/{employee}/reset-password', [App\Http\Controllers\EmployeeController::class, 'resetPassword']);

    Route::get('leave-requests', [App\Http\Controllers\AdminLeaveRequestController::class, 'index'])->name('admin.leave-requests.index');
    Route::patch('leave-requests/{leaveRequest}', [App\Http\Controllers\AdminLeaveRequestController::class, 'update'])->name('admin.leave-requests.update');
    Route::post('leave-requests/{leaveRequest}/upload-surat', [App\Http\Controllers\AdminLeaveRequestController::class, 'uploadSurat'])->name('admin.leave-requests.upload-surat');

    Route::get('travel-requests', [App\Http\Controllers\AdminTravelRequestController::class, 'index'])->name('admin.travel-requests.index');
    Route::patch('travel-requests/{travelRequest}', [App\Http\Controllers\AdminTravelRequestController::class, 'update'])->name('admin.travel-requests.update');

    Route::get('whistleblowing', [App\Http\Controllers\WhistleblowingController::class, 'index'])->name('admin.whistleblowing.index');

    Route::get('reports', [App\Http\Controllers\ReportController::class, 'index'])->name('admin.reports.index');
    Route::get('reports/export', [App\Http\Controllers\ReportController::class, 'export'])->name('admin.reports.export');
    Route::get('reports/export-matrix', [App\Http\Controllers\ReportController::class, 'exportMatrix'])->name('admin.reports.export-matrix');

    // [IZIN DADAKAN] Admin bisa memberikan izin langsung ke karyawan
    Route::get('admin-leaves', [App\Http\Controllers\AdminLeaveGrantController::class, 'index'])->name('admin.admin-leaves.index');
    Route::post('admin-leaves', [App\Http\Controllers\AdminLeaveGrantController::class, 'store'])->name('admin.admin-leaves.store');
    Route::delete('admin-leaves/{adminLeave}', [App\Http\Controllers\AdminLeaveGrantController::class, 'destroy'])->name('admin.admin-leaves.destroy');
});

Route::get('/forgot-password', function () {
    return inertia('Auth/ForgotPassword');
})->middleware('guest');

// Public WBS Routes (akses bayangan tanpa login)
Route::get('/wbs-private/{hash}', [\App\Http\Controllers\WhistleblowingController::class, 'showPublicForm'])->name('wbs.public.form');
Route::post('/wbs-private/{hash}/submit', [\App\Http\Controllers\WhistleblowingController::class, 'storePublic'])->name('wbs.public.store');

// [FIX M-6] Route debug WBS DIHAPUS dari production — mengekspos hash keamanan secara publik
// Route::get('/debug-wbs/{hash}', ...); ← DIHAPUS
