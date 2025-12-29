@extends('layouts.admin')

@section('admin-content')
    <div class="card">
        <div class="card-header">Karyawan</div>
        <div class="card-body">
            <a href="{{ route('admin.employees.create') }}" class="btn btn-primary mb-3">Tambah Karyawan</a>

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
                        <th>Status</th>
                        <th>NIP / ID</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($employees as $employee)
                        <tr>
                            <td>{{ $employee->id }}</td>
                            <td>{{ $employee->name }}</td>
                            <td>{{ $employee->profession->name ?? 'N/A' }}</td>
                            <td>{{ strtoupper($employee->status) }}</td>
                            <td>{{ $employee->status == 'pns' ? $employee->nip : $employee->employee_id }}</td>
                            <td>
                                <!-- Tombol pemicu modal -->
                                <button type="button" class="btn btn-danger btn-sm delete-btn" data-bs-toggle="modal" data-bs-target="#deleteModal" data-action="{{ route('admin.employees.destroy', $employee) }}">
                                    Hapus
                                </button>
                                <form action="{{ route('admin.employees.reset-password', $employee) }}" method="POST" class="d-inline">
                                    @csrf
                                    <button type="submit" class="btn btn-warning btn-sm">Atur Ulang Kata Sandi</button>
                                </form>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6">Tidak ada karyawan ditemukan.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

    <!-- Modal Konfirmasi Hapus -->
    <div class="modal fade" id="deleteModal" tabindex="-1" aria-labelledby="deleteModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="deleteModalLabel">Konfirmasi Hapus</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    Apakah Anda benar-benar yakin ingin menghapus data ini? Aksi ini tidak dapat dibatalkan.
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                    <form id="deleteForm" action="" method="POST">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="btn btn-danger">Ya, Hapus</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function () {
        var deleteModal = document.getElementById('deleteModal');
        deleteModal.addEventListener('show.bs.modal', function (event) {
            // Tombol yang memicu modal
            var button = event.relatedTarget;
            // Ekstrak URL dari atribut data-action
            var action = button.getAttribute('data-action');
            // Update action dari form di dalam modal
            var form = document.getElementById('deleteForm');
            form.action = action;
        });
    });
</script>
@endpush
