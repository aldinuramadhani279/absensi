@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-10">
            <div class="card">
                <div class="card-header">{{ __('Riwayat Absensi Saya') }}</div>

                <div class="card-body">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Clock In</th>
                                <th>Clock Out</th>
                                <th>Shift</th>
                                <th>Status</th>
                                <th>Catatan</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($attendances as $attendance)
                                <tr>
                                    <td>{{ \Carbon\Carbon::parse($attendance->clock_in)->format('d-m-Y') }}</td>
                                    <td>{{ \Carbon\Carbon::parse($attendance->clock_in)->format('H:i:s') }}</td>
                                    <td>{{ $attendance->clock_out ? \Carbon\Carbon::parse($attendance->clock_out)->format('H:i:s') : 'N/A' }}</td>
                                    <td>{{ $attendance->shift->name }}</td>
                                    <td>
                                        <span class="badge 
                                            @if($attendance->status == 'on_time') bg-success 
                                            @elseif($attendance->status == 'late') bg-danger 
                                            @elseif($attendance->status == 'early') bg-info 
                                            @elseif($attendance->status == 'early_departure') bg-warning 
                                            @endif">
                                            @if($attendance->status == 'on_time') Tepat Waktu
                                            @elseif($attendance->status == 'late') Terlambat
                                            @elseif($attendance->status == 'early') Datang Awal
                                            @elseif($attendance->status == 'early_departure') Pulang Awal
                                            @else {{ str_replace('_', ' ', Str::title($attendance->status)) }}
                                            @endif
                                        </span>
                                    </td>
                                    <td>{{ $attendance->notes }}</td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="6" class="text-center">Tidak ada riwayat absensi yang ditemukan.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>

                    <div class="d-flex justify-content-center">
                        {{ $attendances->links() }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
