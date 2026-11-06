<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStudentRequest;
use App\Http\Requests\UpdateStudentRequest;
use App\Http\Resources\StudentResource;
use App\Models\Student;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $query = Student::query();

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'ilike', "%{$search}%")
                    ->orWhere('nis', 'ilike', "%{$search}%");
            });
        }

        $students = $query->latest()->paginate($request->query('per_page', 15));

        return response()->json(
            StudentResource::collection($students)->response()->getData(true)
        );
    }

    public function store(StoreStudentRequest $request)
    {
        $student = Student::create($request->validated());

        return response()->json([
            'message' => 'Siswa berhasil didaftarkan.',
            'data' => new StudentResource($student)
        ]);
    }

    public function show(Student $student)
    {
        $student->load('classAsignment.academicYear', 'classAsignment.classModel');
        return response()->json([
            ['data' => new StudentResource($student)]
        ]);
    }

    public function update(UpdateStudentRequest $request, Student $student)
    {
        $student->update($request->validated());

        return response()->json([
            'message' => 'Data siswa berhasil diperbaharui',
            'data' => new StudentResource($student->fresh())
        ]);
    }
}
