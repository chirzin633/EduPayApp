<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\StudentResource;
use App\Models\Student;
use App\Services\ReportService;
use Illuminate\Http\Request;
use InvalidArgumentException;

class ReportController extends Controller
{
    public function __construct(protected ReportService $reportService) {}

    // laporan transaksi pembayaran
    public function paymentReport(Request $request)
    {
        $filters = $request->only([
            'academic_year_id',
            'class_id',
            'payment_method',
            'date_from',
            'date_to',
            'search',
            'per_page'
        ]);

        $result = $this->reportService->paymentReport($filters);

        return response()->json([
            'data' => PaymentResource::collection($result['data']),
            'meta' => [
                'current_page' => $result['data']->currentPage(),
                'last_page' => $result['data']->lastPage(),
                'per_page' => $result['data']->perPage(),
                'total' => $result['data']->total()
            ],
            'summary' => $result['summary']
        ]);
    }

    // laporan tunggakan
    public function outstandingBalances(Request $request)
    {
        $filters = $request->only([
            'academic_year_id',
            'class_id',
            'search',
            'per_page'
        ]);

        $result = $this->reportService->outstandingBalance($filters);

        return response()->json([
            'data' => InvoiceResource::collection($result['data']),
            'meta' => [
                'current_page' => $result['data']->currentPage(),
                'last_page' => $result['data']->lastPage(),
                'per_page' => $result['data']->perPage(),
                'total' => $result['data']->total()
            ],
            'summary' => $result['summary']
        ]);
    }

    // riwayat pembayaran per siswa
    public function studentHistory(Student $student)
    {
        $history = $this->reportService->studentHistory($student);

        return response()->json([
            'data' => [
                'student' => new StudentResource($history['student']),
                'class_history' => $history['class_history'],
                'invoices' => InvoiceResource::collection($history['invoices'])
            ]
        ]);
    }

    // export laporan ke csv
    public function export(Request $request, $type)
    {
        if (!in_array($type, ['payments', 'outstanding'])) {
            return response()->json([
                'message' => "Tipe export '{$type}' tidak valid. Gunakan 'payments' atau 'outstanding'."
            ], 422);
        }

        $filters = $request->only([
            'academic_year_id',
            'class_id',
            'payment_method',
            'date_from',
            'date_to',
            'search'
        ]);

        try {
            $filename = $this->reportService->exportCsv($type, $filters);

            return response()->download(
                storage_path("app/{$filename}"),
                basename($filename),
                ['Content-Type' => 'text/csv'],
            )->deleteFileAfterSend(true);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
