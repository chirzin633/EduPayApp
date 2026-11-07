<?php

namespace App\Services;

use App\Models\Payment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class ReceiptService
{
    public function generate(Payment $payment)
    {
        // load relasi
        $payment->load(['recorder', 'invoice.student', 'invoice.academicYear', 'invoice.items']);

        $invoice = $payment->invoice;
        $assignment = $invoice->studentClassAssignment;

        $pdf = Pdf::loadView('pdf.receipt', [
            'payment' => $payment,
            'invoice' => $invoice,
            'assignment' => $assignment
        ]);

        // simpan ke storage agar bisa di-download ulang
        $filename = "receipts/{$payment->receipt_number}.pdf";
        Storage::disk('local')->put($filename, $pdf->output());

        return $filename;
    }

    // Ambil path file PDF yang sudah digenerate.
    public function getReceiptPath($receiptNumber)
    {
        $path = "receipts/{$receiptNumber}.pdf";

        if (!Storage::disk('local')->exists($path)) {
            return null;
        }

        return $path;
    }
}
