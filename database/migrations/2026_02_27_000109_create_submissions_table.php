<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One attempt per participant per question. Unique(participant_id, question_id).
     */
    public function up(): void
    {
        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('participant_id')->constrained('quest_participants')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained('quest_questions')->cascadeOnDelete();
            $table->text('answer')->nullable();
            $table->boolean('is_correct')->default(false);
            $table->timestamp('submitted_at')->useCurrent();
            $table->unique(['participant_id', 'question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};
