@extends('layouts.admin')

@section('admin-content')
    <div class="card">
        <div class="card-header">Buat Laporan Absensi</div>
        <div class="card-body">
            <form action="{{ route('admin.reports.export') }}" method="POST">
                @csrf
                <div class="mb-3">
                    <label for="profession_id" class="form-label">Filter berdasarkan Jabatan (opsional)</label>
                    <select class="form-control" id="profession_id" name="profession_id">
                        <option value="">Semua Jabatan</option>
                        @foreach($professions as $profession)
                            <option value="{{ $profession->id }}">{{ $profession->name }}</option>
                        @endforeach
                    </select>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="start_date" class="form-label">Tanggal Mulai (opsional)</label>
                            <input type="date" class="form-control" id="start_date" name="start_date">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="end_date" class="form-label">Tanggal Selesai (opsional)</label>
                            <input type="date" class="form-control" id="end_date" name="end_date">
                        </div>
                    </div>
                </div>

                <button type="submit" class="btn btn-primary">Ekspor ke Excel</button>
            </form>
        </div>
    </div>
@endsection
