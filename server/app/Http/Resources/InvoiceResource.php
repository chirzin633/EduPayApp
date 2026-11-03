<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
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
            'invoice_number' => $this->invoice_number,
            'student' => new StudentResource($this->whenLoaded('student')),
            'academic_year' => new AcademicYearResource($this->whenLoaded('academicYear')),
            'invoice_date' => $this->invoice_date?->format('Y-m-d'),
            'due_date' => $this->due_date?->format('Y-m-d'),
            'subtotal' => (float) $this->subtotal,
            'discount' => [
                'type' => $this->discount_type,
                'rate' => $this->discount_rate,
                'amount' => (float) $this->discount_amount
            ],
            'total_amount' => (float) $this->total_amount,
            'paid_amount' => (float) $this->paid_amount,
            'outstanding_amount' => (float) $this->outstanding_amount,
            'status' => $this->status,
            'items' => InvoiceItemResource::collection($this->whenLoaded('items')),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'created_at' => $this->created_at?->toIso8601String()
        ];
    }
}
