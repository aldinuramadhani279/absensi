@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-8">
            @if($forgotClockOut)
                <div class="alert alert-danger">
                    <strong>Peringatan!</strong> Anda lupa untuk clock out pada tanggal {{ \Carbon\Carbon::parse($forgotClockOut->clock_in)->format('d-m-Y') }}. Silakan hubungi administrator.
                </div>
            @endif
            
            <div class="card">
                <div class="card-header">{{ __('Absensi') }}</div>

                <div class="card-body">
                    @if(session('success'))
                        <div class="alert alert-success">{{ session('success') }}</div>
                    @endif
                    @if(session('error'))
                        <div class="alert alert-danger">{{ session('error') }}</div>
                    @endif

                    @if ($attendance && $attendance->clock_out)
                        <p>Anda clock in pada: <strong>{{ $attendance->clock_in }}</strong></p>
                        <p>Anda clock out pada: <strong>{{ $attendance->clock_out }}</strong></p>
                        <p class="text-success"><strong>Absensi Anda untuk hari ini sudah lengkap.</strong></p>

                    @elseif ($attendance)
                        {{-- User has clocked in --}}
                        <p>Anda clock in pada: <strong>{{ $attendance->clock_in }}</strong></p>
                        <p>Shift Anda adalah: <strong>{{ $attendance->shift->name }} ({{ \Carbon\Carbon::parse($attendance->shift->start_time)->format('H:i') }} - {{ \Carbon\Carbon::parse($attendance->shift->end_time)->format('H:i') }})</strong></p>
                        
                        <hr>

                        <form action="{{ route('attendance.clockout') }}" method="POST">
                            @csrf
                            <button type="submit" class="btn btn-danger">Clock Out</button>
                        </form>
                        
                        <hr>
                        
                        <h5>Ajukan Pulang Lebih Awal</h5>
                        <form action="{{ route('attendance.early-departure') }}" method="POST" class="mt-2">
                            @csrf
                            <div class="mb-3">
                                <label for="notes" class="form-label">Alasan</label>
                                <textarea class="form-control" id="notes" name="notes" rows="3" required></textarea>
                            </div>
                            <button type="submit" class="btn btn-warning">Kirim Permintaan</button>
                        </form>
                    @else
                        {{-- User has not clocked in --}}
                        <p>Anda belum clock in hari ini.</p>
                        <form action="{{ route('attendance.clockin') }}" method="POST">
                            @csrf
                            <div class="mb-3">
                                <label for="shift_id" class="form-label">Pilih Shift</label>
                                <select name="shift_id" id="shift_id" class="form-control" required>
                                    <option value="">-- Pilih Shift --</option>
                                    @foreach($shifts as $shift)
                                        <option value="{{ $shift->id }}">{{ $shift->name }} ({{ \Carbon\Carbon::parse($shift->start_time)->format('H:i') }} - {{ \Carbon\Carbon::parse($shift->end_time)->format('H:i') }})</option>
                                    @endforeach
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary">Clock In</button>
                        </form>
                    @endif
                </div>
            </div>

            <div class="card mt-4">
                <div class="card-header">{{ __('Pengaturan Akun') }}</div>
                <div class="card-body">
                    @if(session('success_password'))
                        <div class="alert alert-success">{{ session('success_password') }}</div>
                    @endif
                    @if(session('error_password'))
                        <div class="alert alert-danger">{{ session('error_password') }}</div>
                    @endif

                    <p>Lupa atau ingin mengganti kata sandi Anda? Klik tombol di bawah untuk mengirim permintaan ke admin.</p>
                    <form action="{{ route('password.request_from_profile') }}" method="POST">
                        @csrf
                        <button type="submit" class="btn btn-warning">Minta Ganti Kata Sandi</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
