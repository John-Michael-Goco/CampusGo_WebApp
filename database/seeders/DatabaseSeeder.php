<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Default admin account. Created on migrate:fresh --seed; password can be changed after login.
     * This user cannot be deleted from the Users page.
     */
    private const DEFAULT_ADMIN_EMAIL = 'admin@email.com';

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => self::DEFAULT_ADMIN_EMAIL],
            [
                'name' => 'Admin',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
            ]
        );
    }
}
