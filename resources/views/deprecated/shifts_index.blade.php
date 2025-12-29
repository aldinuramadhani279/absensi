@extends('layouts.admin')

@section('admin-content')
    <div class="card">
        <div class="card-header">Shift</div>
        <div class="card-body">
            <a href="{{ route('admin.shifts.create') }}" class="btn btn-primary mb-3">Tambah Shift</a>

            @if(session('success'))
                <div class="alert alert-success">
                    {{ session('success') }}
                </div>
            @endif

            <table class="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nama</th>
                        <th>Jabatan</th>
                        <th>Waktu Mulai</th>
                        <th>Waktu Selesai</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($shifts as $shift)
                        <tr>
                            <td>{{ $shift->id }}</td>
                            <td>{{ $shift->name }}</td>
                            <td>{{ $shift->profession->name }}</td>
                            <td>{{ \Carbon\Carbon::parse($shift->start_time)->format('H:i') }}</td>
                            <td>{{ \Carbon\Carbon::parse($shift->end_time)->format('H:i') }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5">Tidak ada shift ditemukan.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
@endsection
