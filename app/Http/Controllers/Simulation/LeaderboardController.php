<?php

namespace App\Http\Controllers\Simulation;

use App\Http\Controllers\Controller;
use App\Services\LeaderboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeaderboardController extends Controller
{
    public function __construct(
        private LeaderboardService $leaderboardService
    ) {}

    /**
     * Show the leaderboard screen in the mobile simulation.
     */
    public function index(Request $request): Response
    {
        $period = $request->query('period', LeaderboardService::PERIOD_WEEK);
        $data = $this->leaderboardService->getDataForPeriod($period);

        return Inertia::render('simulation/leaderboard', [
            'entries' => $data['entries'],
            'period' => $data['period'],
            'periods' => $data['periods'],
            'value_label' => $data['value_label'],
        ]);
    }
}
