<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Every points change. transaction_type: quest_reward, buy_in, store_redeem, buy_in_refund, transfer_in, transfer_out.
     */
    public function up(): void
    {
        Schema::create('point_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->integer('amount');
            $table->enum('transaction_type', [
                'quest_reward',
                'buy_in',
                'store_redeem',
                'buy_in_refund',
                'transfer_in',
                'transfer_out',
            ]);
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('point_transactions');
    }
};
