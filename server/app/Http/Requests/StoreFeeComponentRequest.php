<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Override;

class StoreFeeComponentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'default_amount' => ['required', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean']
        ];
    }

    #[Override]
    public function messages()
    {
        return [
            'name.required' => 'Nama komponen biaya wajib diisi.',
            'default_amount.required' => 'Nominal default wajib diisi.',
            'default_amount.min' => 'Nominal default tidak boleh negatif.',
        ];
    }
}
