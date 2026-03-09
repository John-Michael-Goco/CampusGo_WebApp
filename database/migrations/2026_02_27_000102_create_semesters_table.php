<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Stores semesters and which one is current. Admin sets is_current when a new semester starts.
     */
    public function up(): void
    {
        Schema::create('semesters', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g. "1st Sem 2025-2026"
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_current')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('semesters');
    }
};
