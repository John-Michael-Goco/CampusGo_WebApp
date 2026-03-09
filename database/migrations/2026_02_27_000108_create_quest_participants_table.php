<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Implementation plan: current_stage, status (active, eliminated, quit, winner).
     */
    public function up(): void
    {
        Schema::create('quest_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quest_id')->constrained('quests')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('current_stage')->default(1);
            $table->enum('status', ['active', 'eliminated', 'quit', 'winner'])->default('active');
            $table->timestamp('joined_at')->useCurrent();
            $table->unique(['quest_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quest_participants');
    }
};
