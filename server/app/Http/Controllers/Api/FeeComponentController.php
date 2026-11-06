<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFeeComponentRequest;
use App\Http\Requests\UpdateFeeComponentRequest;
use App\Http\Resources\FeeComponentResource;
use App\Models\FeeComponent;
use Illuminate\Http\Request;

class FeeComponentController extends Controller
{
    public function index(Request $request)
    {
        $query = FeeComponent::query();

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $feeComponents = $query->orderBy('name')->paginate($request->query('per_page', 15));

        return response()->json(
            FeeComponentResource::collection($feeComponents)->response()->getData(true)
        );
    }

    public function store(StoreFeeComponentRequest $request)
    {
        $feeComponent = FeeComponent::create($request->validated());

        return response()->json([
            'message' => 'Komponen biaya berhasil dibuat.',
            'data' => new FeeComponentResource($feeComponent)
        ], 201);
    }

    public function show(FeeComponent $feeComponent)
    {
        return response()->json([
            'data' => new FeeComponentResource($feeComponent)
        ]);
    }

    public function update(UpdateFeeComponentRequest $request, FeeComponent $feeComponent)
    {
        $feeComponent->update($request->validated());

        return response()->json([
            'message' => 'Komponen biaya berhasil diperbaharui.',
            'data' => new FeeComponentResource($feeComponent->fresh())
        ]);
    }
}
