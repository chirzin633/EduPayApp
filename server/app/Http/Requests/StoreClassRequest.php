<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Override;

class StoreClassRequest extends FormRequest
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
            'code' => ['required', 'string', 'max:20', 'unique:classes,code'],
            'name' => ['required', 'string', 'max:100'],
            'is_active' => ['nullable', 'boolean']
        ];
    }

    #[Override]
    public function messages()
    {
        return [
            'code.required' => 'Kode kelas wajib diisi.',
            'code.unique' => 'Kode kelas sudah terdaftar.',
            'name.required' => 'Nama kelas wajib diisi.',
        ];
    }
}
