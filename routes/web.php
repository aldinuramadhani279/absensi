<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\ProfessionController;
use App\Http\Controllers\Admin\ShiftController;
use App\Http\Controllers\Admin\EmployeeController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\LeaveRequestController as AdminLeaveRequestController;
use App\Http\Controllers\Admin\PasswordResetController;
use App\Http\Controllers\Admin\Auth\LoginController as AdminLoginController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LeaveRequestController;
use App\Http\Controllers\Auth\PasswordResetRequestController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return redirect('/login');
});

// Admin Authentication Routes
Route::prefix('admin')->group(function () {
    Route::get('/login', [AdminLoginController::class, 'showLoginForm'])->name('admin.login');
    Route::post('/login', [AdminLoginController::class, 'login']);
    Route::post('/logout', [AdminLoginController::class, 'logout'])->name('admin.logout');
});

// Public Password Reset Request Routes
Route::get('password/request', [PasswordResetRequestController::class, 'showPublicRequestForm'])->name('password.request');
Route::post('password/request', [PasswordResetRequestController::class, 'submitPublicRequest']);

// Authentication Routes - Manually defined to disable default password reset
Route::get('login', 'App\Http\Controllers\Auth\LoginController@showLoginForm')->name('login');
Route::post('login', 'App\Http\Controllers\Auth\LoginController@login');
Route::post('logout', 'App\Http\Controllers\Auth\LoginController@logout')->name('logout');

Route::middleware(['auth'])->group(function () {
    Route::get('password/force-change', [PasswordResetRequestController::class, 'showForceChangeForm'])->name('password.force_change');
    Route::post('password/force-change', [PasswordResetRequestController::class, 'forceChangePassword'])->name('password.force_change.submit');
    Route::post('password/request-from-profile', [PasswordResetRequestController::class, 'requestFromProfile'])->name('password.request_from_profile');

    Route::get('/home', [HomeController::class, 'index'])->name('home');
    Route::get('/history', [HomeController::class, 'history'])->name('history');

    Route::post('/clockin', [AttendanceController::class, 'clockIn'])->name('attendance.clockin');
    Route::post('/clockout', [AttendanceController::class, 'clockOut'])->name('attendance.clockout');
    Route::post('/early-departure', [AttendanceController::class, 'earlyDeparture'])->name('attendance.early-departure');

    Route::get('/leave-requests', [LeaveRequestController::class, 'index'])->name('leave-requests.index');
    Route::post('/leave-requests', [LeaveRequestController::class, 'store'])->name('leave-requests.store');
});


Route::middleware(['auth', 'is.admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', function () {
        return view('admin.dashboard');
    })->name('dashboard');

    Route::resource('professions', ProfessionController::class)->only(['index', 'create', 'store']);
    Route::resource('shifts', ShiftController::class)->only(['index', 'create', 'store']);
    Route::post('employees/{employee}/reset-password', [EmployeeController::class, 'resetPassword'])->name('employees.reset-password');
    Route::resource('employees', EmployeeController::class)->except(['show', 'edit', 'update']);
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    Route::post('reports/export', [ReportController::class, 'export'])->name('reports.export');
    Route::get('leave-requests', [AdminLeaveRequestController::class, 'index'])->name('leave-requests.index');
    Route::patch('leave-requests/{leaveRequest}', [AdminLeaveRequestController::class, 'update'])->name('leave-requests.update');

    Route::get('password-resets', [PasswordResetController::class, 'index'])->name('password-resets.index');
    Route::post('password-resets/{id}/approve', [PasswordResetController::class, 'approve'])->name('password-resets.approve');
});
