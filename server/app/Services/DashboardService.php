<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Student;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    // statistik ringkas
    public function getSummaryStats($academicYearId = null)
    {
        $invoiceQuery = Invoice::where('status', '!=', 'cancelled');
        $paymentQuery = Payment::where('status', 'completed');
        $studentQuery = Student::where('is_active', true);

        if ($academicYearId) {
            $studentQuery->whereHas('classAssignment', fn($q) => $q->where('academic_year_id', $academicYearId));
            $invoiceQuery->where('academic_year_id', $academicYearId);
            $paymentQuery->whereHas('invoice', fn($q) => $q->where('academic_year_id', $academicYearId));
        }

        $invoiceStats = $invoiceQuery
            ->selectRaw('COALESCE(SUM(outstanding_amount), 0) as total_outstanding')
            ->selectRaw("COUNT(*) FILTER (WHERE status = 'unpaid') as unpaid_invoices")
            ->selectRaw("COUNT(*) FILTER (WHERE status = 'partially_paid') as partially_paid_invoices")
            ->selectRaw("COUNT(*) FILTER (WHERE status = 'paid') as paid_invoices")
            ->first();

        return [
            'total_students' => $studentQuery->count(),
            'total_revenue' => (float) $paymentQuery->sum('amount'),
            'total_outstanding' => (float) ($invoiceStats->total_outstanding ?? 0),
            'unpaid_invoices' => (int) ($invoiceStats->unpaid_invoices ?? 0),
            'partially_paid_invoices' => (int) ($invoiceStats->partially_paid_invoices ?? 0),
            'paid_invoices' => (int) ($invoiceStats->paid_invoices ?? 0)
        ];
    }

    // Data grafik: Pendapatan bulanan (12 bulan terakhir)
    public function getMonthlyRevenue($academicYearId = null)
    {
        $startMonth = Carbon::now()->subMonths(11)->startOfMonth();
        $endMonth = Carbon::now()->endOfMonth();

        $query = Payment::where('status', 'completed')
            ->whereBetween('payment_date', [$startMonth, $endMonth])
            ->select(
                DB::raw("TO_CHAR(payment_date, 'YYYY-MM') as month"),
                DB::raw('SUM(amount) as total')
            )
            ->groupBy(DB::raw("TO_CHAR(payment_date, 'YYYY-MM')"));

        if ($academicYearId) {
            $query->whereHas('invoice', fn($q) => $q->where('academic_year_id', $academicYearId));
        }

        $results = $query->pluck('total', 'month');
        $period = CarbonPeriod::create($startMonth, '1 month', $endMonth);

        $months = [];

        foreach ($period as $date) {
            $key = $date->format('Y-m');
            $months[] = [
                'month' => $key,
                'total' => (float) ($results[$key] ?? 0)
            ];
        }

        return $months;
    }

    // Data grafik: Distribusi status pembayaran.
    public function getPaymentStatusDistribution($academicYearId = null)
    {
        $query = Invoice::where('status', '!=', 'cancelled')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status');

        if ($academicYearId) {
            $query->where('academic_year_id', $academicYearId);
        }

        return $query->get()->map(fn($item) => [
            'status' => $item->status,
            'count' => (int) $item->count
        ])->toArray();
    }

    // Data grafik: Pendapatan per metode pembayaran.
    public function getRevenuePaymentMethod($academicYearId = null)
    {
        $query = Payment::where('status', 'completed')
            ->select('payment_method', DB::raw('SUM(amount) as total'))
            ->groupBy('payment_method')
            ->orderByDesc('total');

        if ($academicYearId) {
            $query->whereHas('invoice', fn($q) => $q->where('academic_year_id', $academicYearId));
        }

        return $query->get()->map(fn($item) => [
            'payment_method' => $item->payment_method,
            'total' => (float) $item->total
        ])->toArray();
    }

    // Data grafik: Top 5 kelas dengan tunggakan tertinggi.
    public function getTopOutstandingByClass($academicYearId = null)
    {
        $query = Invoice::query()
            ->join('student_class_assignments', function ($join) {
                $join->on('invoices.student_id', '=', 'student_class_assignments.student_id')
                    ->on('invoices.academic_year_id', '=', 'student_class_assignments.academic_year_id');
            })
            ->join('classes', 'student_class_assignments.class_id', '=', 'classes.id')
            ->where('invoices.status', '!=', 'cancelled')
            ->where('invoices.outstanding_amount', '>', 0)
            ->select(
                'classes.id as class_id',
                'classes.name as class_name',
                DB::raw('SUM(invoices.outstanding_amount) as total_outstanding')
            )
            ->groupBy('classes.id', 'classes.name')
            ->orderByDesc('total_outstanding')
            ->limit(5);

        if ($academicYearId) {
            $query->where('invoices.academic_year_id', $academicYearId);
        }

        return $query->get()->map(fn($item) => [
            'class_id' => (int) $item->class_id,
            'class_name' => $item->class_name,
            'total_outstanding' => $item->total_outstanding
        ])->toArray();
    }
}
