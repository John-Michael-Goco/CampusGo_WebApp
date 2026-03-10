<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Implementation plan: quests with approval, creation payment, rewards, participants.
     */
    public function up(): void
    {
        Schema::create('quests', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('quest_type', ['daily', 'event', 'custom', 'enrollment']);
            $table->boolean('is_elimination')->default(true);
            $table->unsignedInteger('buy_in_points')->default(0);
            $table->unsignedInteger('reward_points')->default(0);
            $table->string('reward_custom_prize')->nullable();
            $table->unsignedInteger('max_participants');
            $table->unsignedInteger('current_participants')->default(0);
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['upcoming', 'ongoing', 'completed', 'cancelled'])->default('upcoming');
            $table->enum('approval_status', ['draft', 'pending', 'approved', 'rejected'])->default('draft');
            $table->enum('creation_payment_status', ['pending', 'locked', 'paid', 'refunded'])->nullable();
            $table->unsignedInteger('creation_cost_points')->nullable();
            $table->foreignId('semester_id')->nullable()->constrained('semesters')->nullOnDelete();
            $table->dateTime('start_date')->nullable();
            $table->dateTime('end_date')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quests');
    }
};
