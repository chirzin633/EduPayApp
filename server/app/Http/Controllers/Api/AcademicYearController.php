<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAcademicYearRequest;
use App\Http\Requests\UpdateAcademicYearRequest;
use App\Http\Resources\AcademicYearResource;
use App\Models\AcademicYear;
use Illuminate\Http\Request;

class AcademicYearController extends Controller
{
    public function index(Request $request)
    {
        $query = AcademicYear::query();

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $academicYears = $query->orderByDesc('start_date')->paginate($request->query('per_page', 15));

        return response()->json(AcademicYearResource::collection($academicYears)->response()->getData(true));
    }

    public function store(StoreAcademicYearRequest $request)
    {
        $data = $request->validated();

        if (!empty($data['is_active'])) {
            AcademicYear::where('is_active', true)->update(['is_active' => false]);
        }

        $academicYear = AcademicYear::create($data);

        return response()->json([
            'message' => 'Tahun ajaran berhasil dibuat.',
            'data' => new AcademicYearResource($academicYear)
        ], 201);
    }

    public function show(AcademicYear $academicYear)
    {
        return response()->json([
            'data' => new AcademicYearResource($academicYear)
        ]);
    }

    public function update(UpdateAcademicYearRequest $request, AcademicYear $academicYear)
    {
        $data =  $request->validated();

        if (!empty($data['is_active'])) {
            AcademicYear::where('id', '!=', $academicYear->id)
                ->where('is_active', true)
                ->update(['is_active' => false]);
        }

        $academicYear->update($data);

        return response()->json([
            'message' => 'Tahun ajaran berhasil diupdate.',
            'data' => new AcademicYearResource(
                $academicYear->fresh()
            )
        ]);
    }
}
