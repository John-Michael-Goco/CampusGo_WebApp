<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('achievements', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('requirement_type', ['quest_count', 'level', 'quest_win', 'complete_quest']);
            $table->unsignedInteger('requirement_value');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('achievements');
    }
};
