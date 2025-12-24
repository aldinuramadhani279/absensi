<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Profession;

class ProfessionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Profession::create(['name' => 'Dokter']);
        Profession::create(['name' => 'Perawat']);
        Profession::create(['name' => 'Staff Administrasi']);
    }
}
