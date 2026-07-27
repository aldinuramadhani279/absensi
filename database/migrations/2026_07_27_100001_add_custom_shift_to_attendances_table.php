<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            // Jadikan shift_id nullable agar bisa diisi null untuk shift custom
            $table->foreignId('shift_id')->nullable()->change();
            // Kolom waktu custom untuk Double Shift Custom
            $table->time('custom_shift_start')->nullable()->after('is_auto_closed');
            $table->time('custom_shift_end')->nullable()->after('custom_shift_start');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->foreignId('shift_id')->nullable(false)->change();
            $table->dropColumn(['custom_shift_start', 'custom_shift_end']);
        });
    }
};
