<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStudentClassAssignmentRequest;
use App\Http\Resources\StudentClassAssignmentResource;
use App\Models\StudentClassAssignment;
use Illuminate\Http\Request;

class StudentClassAssignmentController extends Controller
{
    public function index(Request $request)
    {
        $query = StudentClassAssignment::with(['student', 'academicYear', 'classModel']);

        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', $request->query('academic_year_id'));
        }

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->query('class_id'));
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->query('student_id'));
        }

        $assignments = $query->latest()->paginate($request->query('per_page', 15));

        return response()->json(
            StudentClassAssignmentResource::collection($assignments)->response()->getData(true)
        );
    }

    public function store(StoreStudentClassAssignmentRequest $request)
    {
        $assignment = StudentClassAssignment::create($request->validated());

        $assignment->load(['student', 'academicYear', 'classModel']);

        return response()->json([
            'message' => 'Penempatan siswa ke kelas berhasil.',
            'data' => new StudentClassAssignmentResource($assignment)
        ], 201);
    }

    public function show(StudentClassAssignment $studentClassAssignment)
    {
        $studentClassAssignment->load(['student', 'academicYear', 'classModel']);

        return response()->json([
            'data' => new StudentClassAssignmentResource($studentClassAssignment)
        ]);
    }
}
