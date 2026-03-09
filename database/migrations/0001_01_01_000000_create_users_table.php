<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Implementation plan: master_users + users (auth & game stats).
     */
    public function up(): void
    {
        Schema::create('master_users', function (Blueprint $table) {
            $table->id();
            $table->string('school_id')->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->enum('role', ['student', 'professor']);
            $table->string('course')->nullable();
            $table->unsignedInteger('year_level')->nullable();
            $table->string('section')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_registered')->default(false);
            $table->timestamps();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('master_user_id')->nullable()->constrained('master_users')->nullOnDelete();
            $table->string('name')->nullable();
            $table->enum('role', ['admin', 'student', 'professor'])->default('student');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->unsignedInteger('points_balance')->default(0);
            $table->unsignedInteger('level')->default(1);
            $table->unsignedInteger('total_completed_quests')->default(0);
            $table->unsignedInteger('total_xp_earned')->default(0);
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
        Schema::dropIfExists('master_users');
    }
};
