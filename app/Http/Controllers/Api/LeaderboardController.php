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
     * Includes current user's rank and value when authenticated.
     */
    public function index(Request $request): JsonResponse
    {
        $period = $request->query('period', LeaderboardService::PERIOD_WEEK);
        $data = $this->leaderboardService->getDataForPeriod($period);

        $payload = [
            'entries' => $data['entries'],
            'period' => $data['period'],
            'periods' => $data['periods'],
            'value_label' => $data['value_label'],
        ];

        $user = $request->user();
        if ($user !== null) {
            $userId = $user->getAuthIdentifier();
            $myEntry = collect($data['entries'])->firstWhere('user_id', $userId);
            $payload['my_rank'] = $myEntry ? (int) $myEntry['rank'] : null;
            $payload['my_value'] = $myEntry ? (int) $myEntry['value'] : null;
        }

        return response()->json($payload);
    }
}
