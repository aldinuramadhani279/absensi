<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Profession;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $profession = Profession::first();

        if ($profession) {
            User::create([
                'name' => 'Admin',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
                'status' => 'pns',
                'is_admin' => true,
                'profession_id' => $profession->id,
            ]);

            User::create([
                'name' => 'User',
                'email' => 'user@example.com',
                'password' => Hash::make('password'),
                'status' => 'non-pns',
                'is_admin' => false,
                'profession_id' => $profession->id,
            ]);
        }
    }
}
