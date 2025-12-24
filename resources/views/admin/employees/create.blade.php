@extends('layouts.admin')

@section('admin-content')
    <div class="card">
        <div class="card-header">Tambah Karyawan</div>
        <div class="card-body">
            <form action="{{ route('admin.employees.store') }}" method="POST">
                @csrf
                <div class="mb-3">
                    <label for="name" class="form-label">Nama</label>
                    <input type="text" class="form-control @error('name') is-invalid @enderror" id="name" name="name" value="{{ old('name') }}">
                    @error('name') <div class="invalid-feedback">{{ $message }}</div> @enderror
                </div>

                <div class="mb-3">
                    <label for="email" class="form-label">Email</label>
                    <input type="email" class="form-control @error('email') is-invalid @enderror" id="email" name="email" value="{{ old('email') }}">
                    @error('email') <div class="invalid-feedback">{{ $message }}</div> @enderror
                </div>

                <div class="mb-3">
                    <label for="password" class="form-label">Kata Sandi</label>
                    <input type="password" class="form-control @error('password') is-invalid @enderror" id="password" name="password">
                    @error('password') <div class="invalid-feedback">{{ $message }}</div> @enderror
                </div>

                <div class="mb-3">
                    <label for="password_confirmation" class="form-label">Konfirmasi Kata Sandi</label>
                    <input type="password" class="form-control" id="password_confirmation" name="password_confirmation">
                </div>

                <div class="mb-3">
                    <label for="profession_id" class="form-label">Jabatan</label>
                    <select class="form-control @error('profession_id') is-invalid @enderror" id="profession_id" name="profession_id">
                        <option value="">Pilih Jabatan</option>
                        @foreach($professions as $profession)
                            <option value="{{ $profession->id }}" {{ old('profession_id') == $profession->id ? 'selected' : '' }}>{{ $profession->name }}</option>
                        @endforeach
                    </select>
                    @error('profession_id') <div class="invalid-feedback">{{ $message }}</div> @enderror
                </div>

                <div class="mb-3">
                    <label for="status" class="form-label">Status</label>
                    <select class="form-control @error('status') is-invalid @enderror" id="status" name="status">
                        <option value="">Pilih Status</option>
                        <option value="pns" {{ old('status') == 'pns' ? 'selected' : '' }}>PNS / PPPK</option>
                        <option value="non-pns" {{ old('status') == 'non-pns' ? 'selected' : '' }}>Non-PNS / Non-PPPK</option>
                    </select>
                    @error('status') <div class="invalid-feedback">{{ $message }}</div> @enderror
                </div>

                <div class="mb-3" id="nip-field" style="display: {{ old('status') == 'pns' ? 'block' : 'none' }};">
                    <label for="nip" class="form-label">NIP</label>
                    <input type="text" class="form-control @error('nip') is-invalid @enderror" id="nip" name="nip" value="{{ old('nip') }}">
                    @error('nip') <div class="invalid-feedback">{{ $message }}</div> @enderror
                </div>

                <button type="submit" class="btn btn-primary">Simpan</button>
            </form>
        </div>
    </div>
@endsection

@push('scripts')
<script>
    document.getElementById('status').addEventListener('change', function () {
        var nipField = document.getElementById('nip-field');
        if (this.value === 'pns') {
            nipField.style.display = 'block';
        } else {
            nipField.style.display = 'none';
        }
    });
</script>
@endpush
