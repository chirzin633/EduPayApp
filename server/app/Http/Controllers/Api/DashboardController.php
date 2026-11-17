<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DashboardFilterRequest;
use App\Services\DashboardService;

class DashboardController extends Controller
{
    public function __construct(protected DashboardService $dashboardService) {}

    public function index(DashboardFilterRequest $request)
    {
        $academicYearId = $request->academicYearId();

        return response()->json([
            'data' => [
                'summary' => $this->dashboardService->getSummaryStats($academicYearId),
                'monthly_revenue' => $this->dashboardService->getMonthlyRevenue($academicYearId),
                'payment_status_distribution' => $this->dashboardService->getPaymentStatusDistribution($academicYearId),
                'revenue_by_payment_method' => $this->dashboardService->getRevenuePaymentMethod($academicYearId),
                'top_outstanding_by_class' => $this->dashboardService->getTopOutstandingByClass($academicYearId)
            ]
        ]);
    }
}
