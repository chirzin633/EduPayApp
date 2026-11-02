<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Override;

class VoidPaymentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'void_reason' => ['required', 'string', 'min:5', 'max:500']
        ];
    }

    #[Override]
    public function messages()
    {
        return [
            'void_reason.required' => 'Alasan pembatalan pembayaran wajib diisi.',
            'void_reason.min' => 'Alasan pembatalan minimal 5 karakter.',
        ];
    }
}
