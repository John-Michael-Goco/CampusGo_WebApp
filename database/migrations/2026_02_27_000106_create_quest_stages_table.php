<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Implementation plan: quest_stages (replaces tasks). Stage closes when max_survivors reached OR stage_deadline passed.
     */
    public function up(): void
    {
        Schema::create('quest_stages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quest_id')->constrained('quests')->cascadeOnDelete();
            $table->unsignedInteger('stage_number');
            $table->string('location_hint');
            $table->unsignedInteger('max_survivors');
            $table->unsignedInteger('minimum_participants')->default(1);
            $table->dateTime('stage_deadline')->nullable();
            $table->enum('status', ['active', 'locked', 'completed', 'failed'])->default('active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quest_stages');
    }
};
