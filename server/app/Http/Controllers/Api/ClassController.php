<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreClassRequest;
use App\Http\Requests\UpdateClassRequest;
use App\Http\Resources\ClassResource;
use App\Models\ClassModel;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    public function index(Request $request)
    {
        $query = ClassModel::query();

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $classes = $query->orderBy('code')->paginate($request->query('per_page', 15));

        return response()->json(
            ClassResource::collection($classes)->response()->getData(true)
        );
    }

    public function store(StoreClassRequest $request)
    {
        $classModel = ClassModel::create($request->validated());

        return response()->json([
            'message' => 'Kelas berhasil dibuat.',
            'data' => new ClassResource($classModel)
        ], 201);
    }

    public function show(ClassModel $class)
    {
        return response()->json([
            'data' => new ClassResource($class)
        ]);
    }

    public function update(UpdateClassRequest $request, ClassModel $class)
    {
        $class->update($request->validated());

        return response()->json([
            'message' => 'Kelas berhasil diperbaharui.',
            'data' => new ClassResource($class->fresh())
        ]);
    }
}
