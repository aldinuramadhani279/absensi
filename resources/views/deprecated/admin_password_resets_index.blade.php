@extends('layouts.admin')

@section('admin-content')
    <div class="card">
        <div class="card-header">Permintaan Reset Kata Sandi</div>
        <div class="card-body">

            @if(session('success'))
                <div class="alert alert-success">
                    {{ session('success') }}
                </div>
            @endif

            <table class="table">
                <thead>
                    <tr>
                        <th>ID Permintaan</th>
                        <th>Nama Pengguna</th>
                        <th>NIK</th>
                        <th>Waktu Permintaan</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($requests as $request)
                        <tr>
                            <td>{{ $request->id }}</td>
                            <td>{{ $request->user->name ?? 'N/A' }}</td>
                            <td>{{ $request->user->nik ?? 'N/A' }}</td>
                            <td>{{ $request->created_at->format('d-m-Y H:i:s') }}</td>
                            <td>
                                <form action="{{ route('admin.password-resets.approve', $request->id) }}" method="POST" class="d-inline">
                                    @csrf
                                    <button type="submit" class="btn btn-success btn-sm">Setujui</button>
                                </form>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5">Tidak ada permintaan reset kata sandi yang tertunda.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
@endsection
