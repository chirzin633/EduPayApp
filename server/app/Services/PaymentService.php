<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;

class PaymentService
{
    public function generateReceiptNumber()
    {
        $prefix = 'PAY-' . date('Ym') . '-';

        $lastPayment = Payment::where('receipt_number', 'like', $prefix . '%')
            ->lockForUpdate()
            ->orderByDesc('id')
            ->first();

        if (!$lastPayment) {
            return $prefix . '00001';
        }

        $lastNumber = (int) substr($lastPayment->receipt_number, -5);
        $nextNumber = str_pad($lastNumber + 1, 5, '0', STR_PAD_LEFT);

        return $prefix . $nextNumber;
    }

    public function updateInvoicePaymentStatus(Invoice $invoice)
    {
        $totalPaid = $invoice->payments()
            ->where('status', 'completed')
            ->sum('amount');

        $outstanding = $invoice->total_amount - $totalPaid;
        $outstanding = max(0, $outstanding); // Pastikan tidak bernilai negatif

        // tentukan status tagihan baru
        if ($totalPaid <= 0) {
            $status = 'unpaid';
        } elseif ($totalPaid >= $invoice->total_amount) {
            $status = 'paid';
        } else {
            $status = 'partially_paid';
        }

        $invoice->update([
            'paid_amount' => $totalPaid,
            'outstanding_amount' => $outstanding,
            'status' => $status
        ]);
    }
}
