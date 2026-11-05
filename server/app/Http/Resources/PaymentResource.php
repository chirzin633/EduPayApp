<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'receipt_number' => $this->receipt_number,
            'invoice_id' => $this->invoice_id,
            'payment_date' => $this->payment_date?->toIso8601String(),
            'amount' => (float) $this->amount,
            'payment_method' => $this->payment_method,
            'status' => $this->status,
            'recorded_by' => [
                'id' => $this->recorder?->id,
                'name' => $this->recorder?->name
            ],
            'audit' => $this->when($this->status === 'voided', [
                'voided_at' => $this->voided_at?->toIso8601String(),
                'void_reason' => $this->void_reason,
                'void_by' => [
                    'id' => $this->voider?->id,
                    'name' => $this->voider?->name,
                ],
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
