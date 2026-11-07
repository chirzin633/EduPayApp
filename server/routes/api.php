<?php

use App\Http\Controllers\Api\AcademicYearController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClassController;
use App\Http\Controllers\Api\FeeComponentController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReceiptController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\StudentClassAssignmentController;
use App\Http\Controllers\Api\StudentController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Academic Years
    Route::apiResource('academic-years', AcademicYearController::class)
        ->only(['index', 'store', 'show', 'update'])
        ->middleware('role:admin');

    // Classes
    Route::apiResource('classes', ClassController::class)
        ->only(['index', 'store', 'show', 'update'])
        ->middleware('role:admin');

    // Students
    Route::apiResource('students', StudentController::class)
        ->only(['index', 'store', 'show', 'update'])
        ->middleware('role:admin');

    // Students Class Assignment
    Route::apiResource('student-class-assignments', StudentClassAssignmentController::class)
        ->only(['index', 'store', 'show'])
        ->middleware('role:admin');

    // Fee Components
    Route::apiResource('fee-components', FeeComponentController::class)
        ->only(['index', 'store', 'show'])
        ->middleware('role:admin');

    // Invoices
    Route::apiResource('invoices', InvoiceController::class)
        ->only(['index', 'store', 'show'])
        ->middleware('role:admin,principal');

    Route::post('/invoices/{invoice}/cancel', [InvoiceController::class, 'cancel'])
        ->middleware('role:admin');

    // Payments
    Route::apiResource('payments', PaymentController::class)
        ->only(['index', 'store', 'show'])
        ->middleware('role:admin,principal');

    Route::post('/payments/{payment}/void', [PaymentController::class, 'void'])
        ->middleware('role:admin');

    // Receipts
    Route::get('/receipts/{payment}', [ReceiptController::class, 'generate'])
        ->middleware('role:admin');

    // Financial Reports
    Route::prefix('reports')->middleware('role:admin,principal')->group(function () {
        Route::get('/payments', [ReportController::class, 'paymentReport']);
        Route::get('/outstanding-balances', [ReportController::class, 'outstandingBalances']);
        Route::get('/student-history/{student}', [ReportController::class, 'studentHistory']);
        Route::get('/export/{type}', [ReportController::class, 'export']);
    });
});
