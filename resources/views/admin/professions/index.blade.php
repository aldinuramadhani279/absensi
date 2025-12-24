@extends('layouts.admin')

@section('admin-content')
    <div class="card">
        <div class="card-header">Jabatan</div>
        <div class="card-body">
            <a href="{{ route('admin.professions.create') }}" class="btn btn-primary mb-3">Tambah Jabatan</a>

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
                        <th>Dibuat Pada</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($professions as $profession)
                        <tr>
                            <td>{{ $profession->id }}</td>
                            <td>{{ $profession->name }}</td>
                            <td>{{ $profession->created_at->format('d-m-Y H:i') }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="3">Tidak ada jabatan ditemukan.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
@endsection
