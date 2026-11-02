<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Override;

class StoreInvoiceRequest extends FormRequest
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
            'student_id' => ['required', 'exists:students,id'],
            'student_class_assignment_id' => ['required', 'exists:student_class_assignments,id'],
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'invoice_date' => ['required', 'date'],
            'due_date' => ['required', 'date', 'after_or_equal:invoice_date'],

            // aturan validasi diskon
            'discount_type' => ['nullable', 'string', 'in:percentage,fixed_amount'],
            'discount_rate' => [
                'required_if:discount_type,percentage',
                'nullable',
                'integer',
                'min:1',
                'max:100'
            ],
            'discount_amount' => [
                'required_if:discount_type,fixed_amount',
                'nullable',
                'numeric',
                'min:0'
            ],

            // validasi rincian biaya (item tagihan)
            'items' => ['required', 'array', 'min:1'],
            'items.*.fee_component_id' => ['nullable', 'exists:fee_components,id'],
            'items.*.fee_name' => ['required', 'string', 'max:255'],
            'items.*.amount' => ['required', 'numeric', 'min:0'],
        ];
    }

    #[Override]
    public function messages()
    {
        return [
            'student_id.required' => 'Siswa wajib dipilih.',
            'student_class_assignment_id.required' => 'Penempatan kelas siswa wajib dipilih.',
            'academic_year_id.required' => 'Tahun ajaran wajib dipilih.',
            'due_date.after_or_equal' => 'Tanggal jatuh tempo tidak boleh sebelum tanggal tagihan.',
            'discount_rate.integer' => 'Persentase diskon harus berupa bilangan bulat (tanpa desimal).',
            'discount_rate.min' => 'Persentase diskon minimal adalah 1%.',
            'discount_rate.max' => 'Persentase diskon maksimal adalah 100%.',
            'discount_amount.numeric' => 'Nominal diskon harus berupa angka.',
            'items.required' => 'Tagihan harus memiliki minimal satu rincian komponen biaya.',
        ];
    }
}
