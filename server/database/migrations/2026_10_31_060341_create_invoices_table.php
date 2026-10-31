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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->foreignId('student_id')->constrained('students')->restrictOnDelete();
            $table->foreignId('student_class_assignment_id')->constrained('student_class_assignments')->restrictOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->restrictOnDelete();

            $table->date('invoice_date');
            $table->date('due_date');

            $table->decimal('subtotal', 12, 2)->default(0);

            $table->enum('discount_type', ['percentage', 'fixed_amount'])->nullable();
            $table->unsignedInteger('discount_rate')->nullable();
            $table->decimal('discount_amount', 12, 2)->default(0);

            $table->decimal('total_amount', 12, 2)->default(0);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->decimal('outstanding_amount', 12, 2)->default(0);

            $table->enum('status', ['unpaid', 'partially_paid', 'paid', 'cancelled'])->default('unpaid');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
