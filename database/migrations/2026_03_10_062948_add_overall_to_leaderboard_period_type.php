<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Add 'overall' to leaderboard.period_type enum.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE leaderboard MODIFY COLUMN period_type ENUM('today', 'week', 'month', 'semester', 'overall') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE leaderboard MODIFY COLUMN period_type ENUM('today', 'week', 'month', 'semester') NOT NULL");
    }
};
