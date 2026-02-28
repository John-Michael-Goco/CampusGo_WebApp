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
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quest_id')->constrained('quests')->cascadeOnDelete();
            $table->unsignedInteger('task_order');
            $table->string('title');
            $table->string('location_text');
            $table->string('qr_code_value')->unique();
            $table->unsignedInteger('max_survivors');
            $table->unsignedInteger('minimum_participants')->default(1);
            $table->dateTime('stage_deadline')->nullable();
            $table->enum('status', ['active', 'locked', 'completed', 'failed'])->default('active');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};

