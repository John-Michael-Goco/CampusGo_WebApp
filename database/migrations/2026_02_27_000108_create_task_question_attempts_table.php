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
        Schema::create('task_question_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_question_id')->constrained('task_questions')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('answer_submitted');
            $table->boolean('is_correct')->default(false);
            $table->unsignedInteger('response_time_seconds')->nullable();
            $table->timestamp('attempted_at')->useCurrent();

            $table->unique(['task_question_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_question_attempts');
    }
};

