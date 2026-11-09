<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' =>  'admin@mail.com'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('admin'),
                'role' => 'admin',
                'is_active' => true
            ]
        );

        User::updateOrCreate(
            ['email' => 'kepsek@mail.com'],
            [
                'name' => 'Headmaster',
                'password' => Hash::make('kepsek'),
                'role' => 'principal',
                'is_active' => true
            ]
        );
    }
}
