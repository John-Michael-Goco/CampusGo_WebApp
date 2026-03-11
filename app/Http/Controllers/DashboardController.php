<?php

namespace App\Http\Controllers;

use App\Models\Quest;
use App\Models\Semester;
use App\Models\User;
use App\Services\LeaderboardService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private LeaderboardService $leaderboardService
    ) {}

    /**
     * Display the dashboard with current semester, students count, active quests,
     * top 10 leaderboard (today only), and top achievers (students and how many achievements they unlocked).
     */
    public function __invoke(): Response
    {
        $currentSemester = Semester::current();

        $studentsCount = User::query()
            ->where('role', 'student')
            ->count();

        $activeQuestsCount = Quest::query()
            ->where('approval_status', 'approved')
            ->whereIn('status', ['upcoming', 'ongoing'])
            ->count();

        $data = $this->leaderboardService->getDataForPeriod(LeaderboardService::PERIOD_TODAY);
        $leaderboardToday = array_slice($data['entries'], 0, 10);

        $topAchievers = User::query()
            ->where('role', 'student')
            ->whereHas('userAchievements')
            ->withCount('userAchievements')
            ->orderByDesc('user_achievements_count')
            ->limit(10)
            ->get(['id', 'name'])
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'achievements_count' => (int) $u->user_achievements_count,
            ])
            ->values()
            ->all();

        return Inertia::render('dashboard', [
            'currentSemester' => $currentSemester ? [
                'id' => $currentSemester->id,
                'name' => $currentSemester->name,
                'start_date' => $currentSemester->start_date->format('Y-m-d'),
                'end_date' => $currentSemester->end_date->format('Y-m-d'),
            ] : null,
            'studentsCount' => $studentsCount,
            'activeQuestsCount' => $activeQuestsCount,
            'leaderboardToday' => $leaderboardToday,
            'topAchievers' => $topAchievers,
        ]);
    }
}
