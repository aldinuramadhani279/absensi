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
    Route::get('/history', [App\Http\Controllers\HistoryController::class, 'index'])->name('history.index');
    Route::get('/leave-requests', [App\Http\Controllers\LeaveRequestController::class, 'index'])->name('leave-requests.index');
    Route::post('/leave-requests', [App\Http\Controllers\LeaveRequestController::class, 'store'])->name('leave-requests.store');
    
    Route::get('/travel-requests', [App\Http\Controllers\TravelRequestController::class, 'index'])->name('travel-requests.index');
    Route::post('/travel-requests', [App\Http\Controllers\TravelRequestController::class, 'store'])->name('travel-requests.store');
    
    Route::post('/whistleblowing', [\App\Http\Controllers\WhistleblowingController::class, 'store'])->name('whistleblowing.store');

    // Add admin middleware check here later
    Route::get('/admin', [AdminController::class, 'index'])->name('admin.dashboard');
});

// APIs that are called via axios from the frontend pages
// APIs that are called via axios from the frontend pages
Route::prefix('api')->group(function () {
    
    // Public API
    Route::post('/password/request', [App\Http\Controllers\PasswordResetController::class, 'store']);

    Route::middleware('auth')->group(function () {
        Route::post('/clockin', [App\Http\Controllers\AttendanceController::class, 'clockIn']);
        Route::post('/clockout', [App\Http\Controllers\AttendanceController::class, 'clockOut']);
        Route::post('/password/request-from-profile', [App\Http\Controllers\PasswordResetController::class, 'storeFromProfile']);
        
        Route::prefix('admin')->group(function () {
            Route::get('password-resets', [AdminController::class, 'getPasswordResets']);
            Route::post('password-resets/{id}/approve', [AdminController::class, 'approvePasswordReset']);
        });
    });
});


Route::middleware(['auth'])->prefix('admin')->group(function () { 
    Route::post('prune-photos', [\App\Http\Controllers\AdminController::class, 'prunePhotos'])->name('admin.prune-photos');
    Route::post('toggle-duplicate-ip', [\App\Http\Controllers\AdminController::class, 'toggleDuplicateIp'])->name('admin.toggle-duplicate-ip');

    // Resource routes for master data
    Route::resource('professions', App\Http\Controllers\ProfessionController::class)->except(['create', 'edit', 'show', 'update']);
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
});

Route::get('/forgot-password', function () {
    return inertia('Auth/ForgotPassword');
})->middleware('guest');

// Public WBS Routes (akses bayangan tanpa login)
Route::get('/wbs-private/{hash}', [\App\Http\Controllers\WhistleblowingController::class, 'showPublicForm'])->name('wbs.public.form');
Route::post('/wbs-private/{hash}/submit', [\App\Http\Controllers\WhistleblowingController::class, 'storePublic'])->name('wbs.public.store');

Route::get('/debug-wbs/{hash}', function ($hash) {
    return response()->json([
        'received_hash' => $hash,
        'config_hash' => config('app.wbs_hash'),
        'match' => ($hash === config('app.wbs_hash')),
        'env_hash' => env('WBS_SECURE_HASH'),
    ]);
});
