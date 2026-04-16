<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('whistleblowings', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // "Kecurangan / Korupsi" atau "Kejahatan / Pelanggaran Khusus"
            $table->text('details'); // Kronologi kejadian
            $table->string('reported_name')->nullable(); // Nama orang yang dilaporkan (jika tahu)
            $table->string('photo_evidence')->nullable(); // Bukti kejadian
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whistleblowings');
    }
};
