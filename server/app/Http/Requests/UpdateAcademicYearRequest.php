<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Override;

class UpdateAcademicYearRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $id = $this->route('academic_year')?->id ?? $this->route('academic_year');

        return [
            'name' => ['required', 'string', 'max:50', 'unique:academic_years,name' . $id],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:star_date'],
            'is_active' => ['nullable', 'boolean']
        ];
    }

    #[Override]
    public function messages()
    {
        return [
            'name.required' => 'Nama tahun ajaran wajib diisi.',
            'name.unique' => 'Nama tahun ajaran sudah terdaftar.',
            'end_date.after' => 'Tanggal selesai harus setelah tanggal mulai.',
        ];
    }
}
