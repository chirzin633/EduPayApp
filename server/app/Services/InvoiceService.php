<?php

namespace App\Services;

use App\Models\Invoice;

class InvoiceService
{
    public function calculateTotals($subtotal, $discountType = null, $discountRate = null, $discountAmountInput = null)
    {
        $discountAmount = 0;

        if ($discountType === 'percentage' && $discountRate > 0) {
            $discountRate = min($discountRate, 100);
            $discountAmount = ($subtotal * $discountRate) / 100;
        } elseif ($discountType === 'fixed_amount' && $discountAmountInput > 0) {
            $discountAmount = $discountAmountInput;
        }

        $discountAmount = min($discountAmount, $subtotal);

        $totalAmount =  $subtotal - $discountAmount;

        return [
            'subtotal' => round($subtotal, 2),
            'discount_type' => $discountType,
            'discount_rate' => $discountType === 'percentage' ? $discountRate : null,
            'discount_amount' => round($discountAmount, 2),
            'total_amount' => round($totalAmount, 2),
            'outstanding_amount' => round($totalAmount, 2)
        ];
    }

    public function generateInvoiceNumber()
    {
        $prefix = 'INV-' . date("Ym") . '-';
        $lastInvoice = Invoice::where('invoice_number', 'like', $prefix . '%')
            ->lockForUpdate()
            ->orderByDesc('id')
            ->first();

        if (!$lastInvoice) {
            return $prefix . '00001';
        }

        $lastNumber = (int) substr($lastInvoice->invoice_number, -5);
        $nextNumber = str_pad($lastNumber + 1, 5, '0', STR_PAD_LEFT);

        return $prefix . $nextNumber;
    }
}
