<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Implementation plan: item_id nullable for custom prizes; optional custom_prize_description, source_quest_id.
     */
    public function up(): void
    {
        Schema::create('user_inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('item_id')->nullable()->constrained('store_items')->nullOnDelete();
            $table->unsignedInteger('quantity')->default(1);
            $table->timestamp('acquired_at')->useCurrent();
            $table->text('custom_prize_description')->nullable();
            $table->foreignId('source_quest_id')->nullable()->constrained('quests')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_inventory');
    }
};
