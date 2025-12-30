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
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    
    Route::get('/home', [HomeController::class, 'index'])->name('home');
    Route::get('/history', [App\Http\Controllers\HistoryController::class, 'index'])->name('history.index');
    Route::get('/leave-requests', [App\Http\Controllers\LeaveRequestController::class, 'index'])->name('leave-requests.index');
    Route::post('/leave-requests', [App\Http\Controllers\LeaveRequestController::class, 'store'])->name('leave-requests.store');
    
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
    // Resource routes for master data
    Route::resource('professions', App\Http\Controllers\ProfessionController::class)->except(['create', 'edit', 'show', 'update']);
    Route::resource('shifts', App\Http\Controllers\ShiftController::class)->except(['create', 'edit', 'show', 'update']);
    
    Route::resource('employees', App\Http\Controllers\EmployeeController::class)->except(['create', 'edit', 'show', 'update']);
    Route::post('employees/{employee}/reset-password', [App\Http\Controllers\EmployeeController::class, 'resetPassword']);

    Route::get('leave-requests', [App\Http\Controllers\AdminLeaveRequestController::class, 'index'])->name('admin.leave-requests.index');
    Route::patch('leave-requests/{leaveRequest}', [App\Http\Controllers\AdminLeaveRequestController::class, 'update'])->name('admin.leave-requests.update');
    
    Route::get('reports', [App\Http\Controllers\ReportController::class, 'index'])->name('admin.reports.index');
    Route::get('reports/export', [App\Http\Controllers\ReportController::class, 'export'])->name('admin.reports.export');
});

Route::get('/forgot-password', function () {
    return inertia('Auth/ForgotPassword');
})->middleware('guest');
