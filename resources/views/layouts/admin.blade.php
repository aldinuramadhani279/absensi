@extends('layouts.admin_base')

@section('content')
<div class="container">
    <div class="row">
        <div class="col-md-3">
            <div class="card">
                <div class="card-header">Menu Admin</div>
                <div class="list-group list-group-flush">
                    <a href="{{ route('admin.dashboard') }}" class="list-group-item list-group-item-action">Dasbor</a>
                    <a href="{{ route('admin.professions.index') }}" class="list-group-item list-group-item-action">Jabatan</a>
                    <a href="{{ route('admin.shifts.index') }}" class="list-group-item list-group-item-action">Shift</a>
                    <a href="{{ route('admin.employees.index') }}" class="list-group-item list-group-item-action">Karyawan</a>
                    <a href="{{ route('admin.reports.index') }}" class="list-group-item list-group-item-action">Laporan</a>
                    <a href="{{ route('admin.leave-requests.index') }}" class="list-group-item list-group-item-action">Pengajuan Cuti</a>
                    <a href="{{ route('admin.password-resets.index') }}" class="list-group-item list-group-item-action">Permintaan Reset Password</a>
                    {{-- Other admin links will go here --}}
                </div>
            </div>
        </div>
        <div class="col-md-9">
            @yield('admin-content')
        </div>
    </div>
</div>
@endsection
