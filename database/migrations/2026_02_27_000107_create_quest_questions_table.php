<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quest_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stage_id')->constrained('quest_stages')->cascadeOnDelete();
            $table->text('question_text');
            $table->enum('question_type', ['trivia', 'riddle', 'qr_scan']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quest_questions');
    }
};
