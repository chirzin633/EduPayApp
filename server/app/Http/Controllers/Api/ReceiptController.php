<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\ReceiptService;
use Illuminate\Support\Facades\Storage;

class ReceiptController extends Controller
{
    public function __construct(protected ReceiptService $receiptService) {}

    public function generate(Payment $payment)
    {
        // cek apakah payment sudah voided
        if ($payment->status === 'voided') {
            return response()->json([
                'message' => 'Kuitansi tidak dapat dicetak untuk pembayaran yang telah dibatalkan.'
            ], 422);
        }

        // cek apakah PDF sudah ada
        $existingPath = $this->receiptService->getReceiptPath($payment->receipt_number);

        if (!$existingPath) {
            $existingPath = $this->receiptService->generate($payment);
        }

        return Storage::download($existingPath);
    }
}
