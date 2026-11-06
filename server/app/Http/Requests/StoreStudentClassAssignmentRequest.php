<?php

namespace App\Http\Requests;

use App\Models\StudentClassAssignment;
use Illuminate\Foundation\Http\FormRequest;
use Override;

class StoreStudentClassAssignmentRequest extends FormRequest
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
            'student_id' => ['required', 'exists:students,id'],
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'class_id' => ['required', 'exists:classes,id']
        ];
    }

    #[Override]
    public function messages()
    {
        return [
            'student_id.required' => 'Siswa wajib dipilih.',
            'student_id.exists' => 'Siswa tidak ditemukan.',
            'academic_year_id.required' => 'Tahun ajaran wajib dipilih.',
            'class_id.required' => 'Kelas wajib dipilih.',
        ];
    }

    // Validasi tambahan: satu siswa = satu kelas per tahun ajaran
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $exists = StudentClassAssignment::where('student_id', $this->student_id)
                ->where('academic_year_id', $this->academic_year_id)
                ->exists();

            if ($exists) {
                $validator->errors()->add('student_id', 'Siswa sudah ditempatkan di kelas pada tahun ajaran ini.');
            }
        });
    }
}
