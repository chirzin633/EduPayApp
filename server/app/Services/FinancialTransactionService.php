<?php

namespace App\Services;

use App\Models\Invoice;
use Exception;
use Illuminate\Support\Facades\DB;

class FinancialTransactionService
{
    public function __construct(
        protected InvoiceService $invoiceService,
        protected PaymentService $paymentService
    ) {}

    public function createInvoice($data)
    {
        return DB::transaction(function () use ($data) {

            if (empty($data['items'])) {
                throw new Exception('Invoice harus memiliki minimal satu item');
            }

            // hitung subtotal dari akumulasi item
            $subtotal = collect($data['items'])->sum('amount');

            // hitung totals dan diskon
            $totals = $this->invoiceService->calculateTotals(
                subtotal: $subtotal,
                discountType: $data['discount_type'] ?? null,
                discountRate: $data['discount_rate'] ?? null,
                discountAmountInput: $data['discount_amount'] ?? null
            );

            // buat invoice header
            $invoice = Invoice::create([
                'invoice_number' => $this->invoiceService->generateInvoiceNumber(),
                'student_id' => $data['student_id'],
                'student_class_assignment_id' => $data['student_class_assignment_id'],
                'academic_year_id' => $data['academic_year_id'],
                'invoice_date' => $data['invoice_date'],
                'due_date' => $data['due_date'],
                'subtotal' => $totals['subtotal'],
                'discount_type' => $totals['discount_type'],
                'discount_rate' => $totals['discount_rate'],
                'discount_amount' => $totals['discount_amount'],
                'total_amount' => $totals['total_amount'],
                'paid_amount' => 0.00,
                'outstanding_amount' => $totals['outstanding_amount'],
                'status' => 'unpaid'
            ]);

            // simpan snapshot rincian item
            foreach ($data['items'] as $item) {

                if (($item['amount'] ?? 0) < 0) {
                    throw new Exception('Nominal item tidak boleh negatif.');
                }

                $invoice->items()->create([
                    'fee_component_id' => $item['fee_component_id'] ?? null,
                    'fee_name' => $item['fee_name'],
                    'amount' => $item['amount']
                ]);
            }

            return $invoice->load('items');
        });
    }
}
