@extends('layouts.admin')

@section('admin-content')
    <div class="card">
        <div class="card-header">{{ __('Kelola Pengajuan Cuti') }}</div>
        <div class="card-body">
            @if(session('success'))
                <div class="alert alert-success">
                    {{ session('success') }}
                </div>
            @endif

            <table class="table">
                <thead>
                    <tr>
                        <th>Pengguna</th>
                        <th>Tanggal</th>
                        <th>Alasan</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($leaveRequests as $leaveRequest)
                        <tr>
                            <td>{{ $leaveRequest->user->name }}</td>
                            <td>{{ \Carbon\Carbon::parse($leaveRequest->start_date)->format('d-m-Y') }} hingga {{ \Carbon\Carbon::parse($leaveRequest->end_date)->format('d-m-Y') }}</td>
                            <td>{{ Str::limit($leaveRequest->reason, 50) }}</td>
                            <td>
                                <span class="badge 
                                    @if($leaveRequest->status == 'approved') bg-success 
                                    @elseif($leaveRequest->status == 'rejected') bg-danger 
                                    @else bg-warning 
                                    @endif">
                                    @if($leaveRequest->status == 'approved') Disetujui
                                    @elseif($leaveRequest->status == 'rejected') Ditolak
                                    @else Menunggu
                                    @endif
                                </span>
                            </td>
                            <td>
                                @if($leaveRequest->status == 'pending')
                                    <form action="{{ route('admin.leave-requests.update', $leaveRequest) }}" method="POST" class="d-inline">
                                        @csrf
                                        @method('PATCH')
                                        <input type="hidden" name="status" value="approved">
                                        <button type="submit" class="btn btn-success btn-sm">Setujui</button>
                                    </form>
                                    <form action="{{ route('admin.leave-requests.update', $leaveRequest) }}" method="POST" class="d-inline">
                                        @csrf
                                        @method('PATCH')
                                        <input type="hidden" name="status" value="rejected">
                                        <button type="submit" class="btn btn-danger btn-sm">Tolak</button>
                                    </form>
                                @else
                                    -
                                @endif
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="text-center">Tidak ada pengajuan cuti ditemukan.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
@endsection
