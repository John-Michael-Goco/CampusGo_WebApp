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
        Schema::create('quest_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quest_id')->constrained('quests')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('current_task_order')->default(1);
            $table->enum('status', ['active', 'eliminated', 'completed'])->default('active');
            $table->unsignedInteger('total_time_seconds')->default(0);
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamp('finished_at')->nullable();

            $table->unique(['quest_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quest_participants');
    }
};

