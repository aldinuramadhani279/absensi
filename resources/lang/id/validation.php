<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Validation Language Lines
    |--------------------------------------------------------------------------
    */

    'required' => 'Kolom :attribute wajib diisi.',
    'string' => 'Kolom :attribute harus berupa string.',
    'max' => [
        'string' => 'Kolom :attribute tidak boleh lebih dari :max karakter.',
    ],
    'unique' => ':attribute sudah digunakan.',
    'email' => 'Kolom :attribute harus berupa alamat email yang valid.',
    'confirmed' => 'Konfirmasi :attribute tidak cocok.',
    'date' => 'Kolom :attribute bukan tanggal yang valid.',
    'date_format' => 'Kolom :attribute tidak cocok dengan format :format.',
    'after_or_equal' => 'Kolom :attribute harus berupa tanggal setelah atau sama dengan :date.',
    'after' => 'Kolom :attribute harus berupa tanggal setelah :date.',
    'exists' => ':attribute yang dipilih tidak valid.',
    'in' => ':attribute yang dipilih tidak valid.',
    'required_if' => 'Kolom :attribute wajib diisi bila :other adalah :value.',
    'min' => [
        'string' => 'Kolom :attribute minimal harus :min karakter.',
    ],


    /*
    |--------------------------------------------------------------------------
    | Custom Validation Attributes
    |--------------------------------------------------------------------------
    |
    | The following language lines are used to swap our attribute placeholder
    | with something more reader friendly such as "E-Mail Address" instead
    | of "email". This simply helps us make our message more expressive.
    |
    */

    'attributes' => [
        'name' => 'Nama',
        'email' => 'Email',
        'password' => 'Kata Sandi',
        'profession_id' => 'Jabatan',
        'shift_id' => 'Shift',
        'status' => 'Status',
        'nip' => 'NIP',
        'start_date' => 'Tanggal Mulai',
        'end_date' => 'Tanggal Selesai',
        'reason' => 'Alasan',
        'notes' => 'Catatan',
        'start_time' => 'Waktu Mulai',
        'end_time' => 'Waktu Selesai',
    ],

];
