<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInvoiceRequest;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Services\FinancialTransactionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    public function __construct(protected FinancialTransactionService $financialService) {}

    public function index(Request $request)
    {
        $query = Invoice::with(['student', 'academicYear']);

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->has('academic_year_id')) {
            $query->where('academic_year_id', $request->query('academic_year_id'));
        }

        if ($request->has('student_id')) {
            $query->where('student_id', $request->query('student_id'));
        }

        $invoice = $query->latest()->paginate($request->query('per_page', 15));

        return InvoiceResource::collection($invoice);
    }

    public function store(StoreInvoiceRequest $request)
    {
        $invoice = $this->financialService->createInvoice($request->validated());

        return response()->json([
            'message' => 'Tagihan berhasil dibuat.',
            'data' => new InvoiceResource($invoice->load(['student', 'academicYear', 'items']))
        ], 201);
    }

    public function show(Invoice $invoice)
    {
        $invoice->load(['student', 'academicYear', 'items', 'payments.recorder', 'payments.voider']);

        return response()->json([
            'data' => new InvoiceResource($invoice)
        ]);
    }

    public function cancel(Invoice $invoice)
    {

        return DB::transaction(function () use ($invoice) {
            $invoice = Invoice::lockForUpdate()->findOrFail($invoice->id);

            if ($invoice->status === 'cancelled') {
                return response()->json([
                    'message' => 'Tagihan sudah dibatalkan sebelumnya.'
                ], 422);
            }

            $hasCompletedPayment = $invoice->payments()
                ->where('status', 'completed')
                ->exists();

            if ($hasCompletedPayment) {
                return response()->json([
                    'message' => 'Tagihan yang sudah memiliki transaksi pembayaran tidak dapat dibatalkan.'
                ], 422);
            }

            $invoice->update([
                'status' => 'cancelled'
            ]);

            return response()->json([
                'message' => 'Tagihan berhasil dibatalkan.',
                'data' => new InvoiceResource($invoice->fresh())
            ]);
        });
    }
}
