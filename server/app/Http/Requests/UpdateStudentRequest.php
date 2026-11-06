<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Override;

class UpdateStudentRequest extends FormRequest
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
        $id = $this->route('student')?->id ?? $this->route('student');

        return [
            'nis' => ['required', 'string', 'max:50', 'unique:students,nis' . $id],
            'full_name' => ['required', 'string', 'max:255'],
            'gender' => ['required', 'in:L,P'],
            'date_of_birth' => ['nullable', 'date'],
            'phone_number' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string'],
            'parent_name' => ['nullable', 'string', 'max:255'],
            'parent_phone' => ['nullable', 'string', 'max:20'],
            'is_active' => ['required', 'boolean']
        ];
    }

    #[Override]
    public function messages()
    {
        return [
            'nis.unique' => 'NIS siswa sudah terdaftar.',
            'full_name.required' => 'Nama lengkap siswa wajib diisi.',
            'gender.in' => 'Jenis kelamin harus L atau P.',
        ];
    }
}
