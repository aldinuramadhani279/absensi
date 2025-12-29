@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-8">
            {{-- Form to submit a new request --}}
            <div class="card mb-4">
                <div class="card-header">{{ __('Ajukan Permohonan Cuti') }}</div>
                <div class="card-body">
                    @if(session('success'))
                        <div class="alert alert-success">{{ session('success') }}</div>
                    @endif
                    <form action="{{ route('leave-requests.store') }}" method="POST">
                        @csrf
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="start_date" class="form-label">Tanggal Mulai</label>
                                <input type="date" class="form-control @error('start_date') is-invalid @enderror" id="start_date" name="start_date" value="{{ old('start_date') }}">
                                @error('start_date') <div class="invalid-feedback">{{ $message }}</div> @enderror
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="end_date" class="form-label">Tanggal Selesai</label>
                                <input type="date" class="form-control @error('end_date') is-invalid @enderror" id="end_date" name="end_date" value="{{ old('end_date') }}">
                                @error('end_date') <div class="invalid-feedback">{{ $message }}</div> @enderror
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="reason" class="form-label">Alasan</label>
                            <textarea class="form-control @error('reason') is-invalid @enderror" id="reason" name="reason" rows="3">{{ old('reason') }}</textarea>
                            @error('reason') <div class="invalid-feedback">{{ $message }}</div> @enderror
                        </div>
                        <button type="submit" class="btn btn-primary">Kirim Permohonan</button>
                    </form>
                </div>
            </div>

            {{-- List of past requests --}}
            <div class="card">
                <div class="card-header">{{ __('Riwayat Permohonan Cuti Saya') }}</div>
                <div class="card-body">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Tanggal Mulai</th>
                                <th>Tanggal Selesai</th>
                                <th>Alasan</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($leaveRequests as $request)
                                <tr>
                                    <td>{{ \Carbon\Carbon::parse($request->start_date)->format('d-m-Y') }}</td>
                                    <td>{{ \Carbon\Carbon::parse($request->end_date)->format('d-m-Y') }}</td>
                                    <td>{{ Str::limit($request->reason, 50) }}</td>
                                    <td>
                                        <span class="badge 
                                            @if($request->status == 'approved') bg-success 
                                            @elseif($request->status == 'rejected') bg-danger 
                                            @else bg-warning 
                                            @endif">
                                            @if($request->status == 'approved') Disetujui
                                            @elseif($request->status == 'rejected') Ditolak
                                            @else Menunggu
                                            @endif
                                        </span>
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="4" class="text-center">Tidak ada permohonan cuti yang ditemukan.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
