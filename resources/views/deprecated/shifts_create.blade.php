@extends('layouts.admin')

@section('admin-content')
    <div class="card">
        <div class="card-header">Tambah Shift</div>
        <div class="card-body">
            <form action="{{ route('admin.shifts.store') }}" method="POST">
                @csrf
                <div class="mb-3">
                    <label for="name" class="form-label">Nama Shift</label>
                    <input type="text" class="form-control @error('name') is-invalid @enderror" id="name" name="name" value="{{ old('name') }}">
                    @error('name')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                </div>

                <div class="mb-3">
                    <label for="profession_id" class="form-label">Jabatan</label>
                    <select class="form-control @error('profession_id') is-invalid @enderror" id="profession_id" name="profession_id">
                        <option value="">Pilih Jabatan</option>
                        @foreach($professions as $profession)
                            <option value="{{ $profession->id }}" {{ old('profession_id') == $profession->id ? 'selected' : '' }}>{{ $profession->name }}</option>
                        @endforeach
                    </select>
                    @error('profession_id')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                </div>

                <div class="mb-3">
                    <label for="start_time" class="form-label">Waktu Mulai</label>
                    <input type="time" class="form-control @error('start_time') is-invalid @enderror" id="start_time" name="start_time" value="{{ old('start_time') }}">
                    @error('start_time')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                </div>

                <div class="mb-3">
                    <label for="end_time" class="form-label">Waktu Selesai</label>
                    <input type="time" class="form-control @error('end_time') is-invalid @enderror" id="end_time" name="end_time" value="{{ old('end_time') }}">
                    @error('end_time')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                </div>

                <button type="submit" class="btn btn-primary">Simpan</button>
            </form>
        </div>
    </div>
@endsection
