<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('quest_participants', function (Blueprint $table) {
            $table->timestamp('updated_at')->nullable()->after('joined_at');
        });
        DB::table('quest_participants')->whereNull('updated_at')->update([
            'updated_at' => DB::raw('joined_at'),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quest_participants', function (Blueprint $table) {
            $table->dropColumn('updated_at');
        });
    }
};
