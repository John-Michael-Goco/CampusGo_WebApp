<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leaderboard', function (Blueprint $table) {
            $table->id();
            $table->enum('period_type', ['today', 'week', 'month', 'semester', 'overall']);
            $table->string('period_key');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('total_points')->default(0);
            $table->unsignedInteger('rank')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leaderboard');
    }
};
