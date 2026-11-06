<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Student;
use Illuminate\Database\Eloquent\Builder;
use InvalidArgumentException;

class ReportService
{
    // laporan transaksi pembayaran dengan filter
    public function paymentReport($filters)
    {
        $query = Payment::with(['recorder', 'invoice.student', 'invoice.academicYear'])
            ->where('status', 'completed');

        $this->applyPaymentFilters($query, $filters);

        $payments = $query->orderByDesc('payment_date')->paginate($filters['per_page'] ?? 25);

        // ringkasan total
        $summaryQuery = Payment::where('status', 'completed');
        $this->applyPaymentFilters($summaryQuery, $filters);
        $summary = [
            'total_transactions' => $summaryQuery->count(),
            'total_amount' => (float) $summaryQuery->sum('amount')
        ];

        return [
            'data' => $payments,
            'summary' => $summary
        ];
    }

    // laporan tunggakan siswa
    public function outstandingBalances($filters)
    {
        $query = Invoice::with(['student', 'academicYear', 'studentClassAssignment.classModel'])
            ->where('status', '!=', 'cancelled')
            ->where('outstanding_amount', '>', 0);

        if (!empty($filters['academic_year_id'])) {
            $query->where('academic_year_id', $filters['academic_year_id']);
        }

        if (!empty($filters['class_id'])) {
            $query->whereHas('studentClassAssignment', function (Builder $q) use ($filters) {
                $q->where('class_id', $filters['class_id']);
            });
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->whereHas('student', function (Builder $q) use ($search) {
                $q->where('full_name', 'ilike', "%{$search}%")
                    ->orWhere('nis', 'ilike', "%{$search}%");
            });
        }

        $invoices = $query->orderByDesc('outstanding_amount')
            ->paginate($filters['per_page'] ?? 25);

        // ringkasan
        $summaryQuery = Invoice::where('status', '!=', 'cancelled')
            ->where('outstanding_amount', '>', 0);

        if (!empty($filters['academic_year_id'])) {
            $summaryQuery->where('academic_year_id', $filters['academic_year_id']);
        }

        $summary = [
            'total_students' => $summaryQuery->distinct('student_id')->count('student_id'),
            'total_outstanding' => (float) $summaryQuery->sum('outstanding_amount')
        ];

        return [
            'data' => $invoices,
            'summary' => $summary
        ];
    }

    // riwayat pembayaran per siswa
    public function studentHistory(Student $student)
    {
        $assignments = $student->classAssignment()
            ->with(['academicYear', 'classModel'])
            ->orderByDesc('academic_year_id')
            ->get();

        $invoices = Invoice::with(['items', 'payment.recorder', 'payment.voider', 'academicYear'])
            ->where('student_id', $student->id)
            ->orderByDesc('invoice_date')
            ->get();

        return [
            'student' => $student,
            'class_history' => $assignments,
            'invoices' => $invoices
        ];
    }

    // export laporan csv
    public function exportCsv($type, $filters)
    {
        $filename = "exports/{$type}_" . date('Y-m-d_His') . '.csv';

        if ($type === 'payments') {
            $result = $this->paymentReport(array_merge($filters, ['per_page' => 10000]));
            $headers = ['No. Kuitansi', 'Tanggal', 'NIS', 'Nama Siswa', 'Tahun Ajaran', 'Metode', 'Nominal', 'Petugas'];

            $rows = collect($result['data']->items())->map(fn($p) => [
                $p->receipt_number,
                $p->payment_date?->format('Y-m-d'),
                $p->invoice?->student?->nis,
                $p->invoice?->student?->full_name,
                $p->invoice?->academicYear?->name,
                $p->payment_method,
                $p->amount,
                $p->recorder?->name
            ]);
        } elseif ($type === 'outstanding') {
            $result = $this->outstandingBalances(array_merge($filters, ['per_page' => 10000]));
            $headers = ['NIS', 'Nama Siswa', 'Kelas', 'Tahun Ajaran', 'No. Tagihan', 'Total Tagihan', 'Terbayar', 'Sisa Tunggakan'];

            $rows = collect($result['data']->items())->map(fn($inv) => [
                $inv->student?->nis,
                $inv->student?->full_name,
                $inv->studentClassAssignment?->classModel?->name,
                $inv->academicYear?->name,
                $inv->invoice_number,
                $inv->total_amount,
                $inv->paid_amount,
                $inv->outstanding_amount,
            ]);
        } else {
            throw new InvalidArgumentException("ipe export '{$type}' tidak valid.");
        }

        $handle = fopen(storage_path("app/{$filename}"), 'w');
        fputcsv($handle, $headers);
        foreach ($rows as $row) {
            fputcsv($handle, $row);
        }
        fclose($handle);

        return $filename;
    }

    //  filter pada query payment report
    private function applyPaymentFilters(Builder $query, $filters)
    {
        if (!empty($filters['academic_year_id'])) {
            $query->whereHas(
                'invoice',
                fn(Builder $q) =>
                $q->where('academic_year_id', $filters['academic_year_id'])
            );
        }

        if (!empty($filters['class_id'])) {
            $query->whereHas(
                'invoice.studentClassAssignment',
                fn(Builder $q) =>
                $q->where('class_id', $filters['class_id'])
            );
        }

        if (!empty($filters['payment_method'])) {
            $query->where('payment_method', $filters['payment_method']);
        }

        if (!empty($filters['date_from'])) {
            $query->where('payment_date', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->where('payment_date', '<=', $filters['date_to']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->whereHas('invoice.student', function (Builder $q) use ($search) {
                $q->where('full_name', 'ilike', "%{$search}%")
                    ->orWhere('nis', 'ilike', "%{$search}%");
            });
        }
    }
}
