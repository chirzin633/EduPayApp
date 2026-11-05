<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RecordPaymentRequest;
use App\Http\Requests\VoidPaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Services\FinancialTransactionService;
use Illuminate\Http\Request;
use InvalidArgumentException;

class PaymentController extends Controller
{
    public function __construct(protected FinancialTransactionService $financialService) {}

    public function index(Request $request)
    {
        $query = Payment::with(['recorder', 'voider']);

        if ($request->has('invoice_id')) {
            $query->where('invoice_id', $request->query('invoice_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->has('payment_method')) {
            $query->where('payment_method', $request->query('payment_method'));
        }

        $payments = $query->latest()->paginate($request->query('per_page', 15));

        return PaymentResource::collection($payments);
    }

    public function store(RecordPaymentRequest $request)
    {
        try {
            $payment = $this->financialService->recordPayment(
                data: $request->validated(),
                userId: $request->user()->id
            );

            return response()->json([
                'message' => 'Pembayaran berhasil dicatat.',
                'data' => new PaymentResource($payment->load('recorder'))
            ], 201);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function show(Payment $payment)
    {
        return response()->json([
            'data' => new PaymentResource($payment->load(['recorder', 'voider']))
        ]);
    }

    public function void(VoidPaymentRequest $request, Payment $payment)
    {
        try {
            $voidedPayment = $this->financialService->voidPayment(
                payment: $payment,
                reason: $request->validated('void_reason'),
                userId: $request->user()->id
            );

            return response()->json([
                'message' => 'Pembayaran berhasil dibatalkan (void).',
                'data' => new PaymentResource($voidedPayment->load(['recorder', 'voider']))
            ]);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 422);
        }
    }
}
