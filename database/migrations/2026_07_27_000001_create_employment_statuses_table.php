<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('employment_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->nullable();
            $table->timestamps();
        });

        // Insert initial default statuses
        $now = now();
        DB::table('employment_statuses')->insert([
            ['name' => 'PNS', 'code' => 'pns', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Non-PNS', 'code' => 'non-pns', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Militer / TNI-Polri', 'code' => 'militer', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'PPPK', 'code' => 'pppk', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'PBLU', 'code' => 'pblu', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employment_statuses');
    }
};
