<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('students_masterlist', function (Blueprint $table) {
            $table->id();
            $table->string('student_number')->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('course');
            $table->unsignedInteger('year_level');
            $table->boolean('is_registered')->default(false);
        });

        Schema::create('professors_masterlist', function (Blueprint $table) {
            $table->id();
            $table->string('employee_id')->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('department');
            $table->boolean('is_registered')->default(false);
        });

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('role', ['student', 'professor', 'admin'])->default('student');
            $table->foreignId('master_student_id')->nullable()->unique()->constrained('students_masterlist')->nullOnDelete();
            $table->foreignId('master_professor_id')->nullable()->unique()->constrained('professors_masterlist')->nullOnDelete();
            $table->unsignedInteger('quests_completed_count')->default(0);
            $table->unsignedInteger('gm_quest_credit')->default(0);
            $table->unsignedInteger('total_points')->default(0);
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

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
        Schema::dropIfExists('professors_masterlist');
        Schema::dropIfExists('students_masterlist');
    }
};
