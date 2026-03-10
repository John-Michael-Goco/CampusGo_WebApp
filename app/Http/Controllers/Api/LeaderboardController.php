<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LeaderboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaderboardController extends Controller
{
    public function __construct(
        private LeaderboardService $leaderboardService
    ) {}

    /**
     * Return leaderboard data as JSON for the mobile app.
     */
    public function index(Request $request): JsonResponse
    {
        $period = $request->query('period', LeaderboardService::PERIOD_WEEK);
        $data = $this->leaderboardService->getDataForPeriod($period);

        return response()->json([
            'entries' => $data['entries'],
            'period' => $data['period'],
            'periods' => $data['periods'],
            'value_label' => $data['value_label'],
        ]);
    }
}
