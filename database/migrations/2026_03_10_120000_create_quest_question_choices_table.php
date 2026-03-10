<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quest_question_choices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quest_question_id')->constrained('quest_questions')->cascadeOnDelete();
            $table->text('choice_text');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_correct')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quest_question_choices');
    }
};
