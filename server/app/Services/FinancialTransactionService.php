<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class FinancialTransactionService
{
    public function __construct(
        protected InvoiceService $invoiceService,
        protected PaymentService $paymentService
    ) {}

    public function createInvoice($data)
    {
        return DB::transaction(function () use ($data) {

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

                $invoice->items()->create([
                    'fee_component_id' => $item['fee_component_id'] ?? null,
                    'fee_name' => $item['fee_name'],
                    'amount' => $item['amount']
                ]);
            }

            return $invoice->load('items');
        });
    }

    public function recordPayment($data, $userId)
    {
        return DB::transaction(function () use ($data, $userId) {
            $invoice = Invoice::where('id', $data['invoice_id'])->lockForUpdate()->firstOrFail();

            if ($invoice->status === 'paid') {
                throw new InvalidArgumentException('Tagihan sudah lunas.');
            }

            if ($invoice->status === 'cancelled') {
                throw new InvalidArgumentException('Tagihan telah dibatalkan.');
            }

            if ($data['amount'] > $invoice->outstanding_amount) {
                throw new InvalidArgumentException('Nominal pembayaran melebihi sisa tunggakan tagihan.');
            }

            // catat pembayaran
            $payment = Payment::create([
                'receipt_number' => $this->paymentService->generateReceiptNumber(),
                'invoice_id' => $invoice->id,
                'recorded_by' => $userId,
                'payment_date' => $data['payment_date'],
                'amount' => $data['amount'],
                'payment_method' => $data['payment_method'],
                'status' => 'completed'
            ]);

            // recalculate invoice status & balance
            $this->paymentService->updateInvoicePaymentStatus($invoice);

            return $payment;
        });
    }

    public function voidPayment(Payment $payment, $reason, $userId)
    {
        return DB::transaction(function () use ($payment, $reason, $userId) {
            if ($payment->status !== 'completed') {
                throw new InvalidArgumentException('Hanya pembayaran completed yang dibatalkan.');
            }

            // update status pembayaran menjadi VOIDED beserta audit log
            $payment->update([
                'status' => 'voided',
                'voided_by' => $userId,
                'voided_at' => now(),
                'voided_reason' => $reason
            ]);

            // recalculate invoice status & balance
            $invoice = Invoice::where('id', $payment->invoice_id)->lockForUpdate()->firstOrFail();
            $this->paymentService->updateInvoicePaymentStatus($invoice);

            return $payment;
        });
    }
}
