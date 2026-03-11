<?php

namespace App\Http\Controllers;

use App\Models\Achievement;
use App\Models\ActivityLog;
use App\Models\PointTransaction;
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
     * top 5 leaderboard (today only), top 5 achievements by users earned,
     * latest 10 point transactions, and latest 10 activity logs.
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
        $leaderboardToday = array_slice($data['entries'], 0, 5);

        $achievementsWithCount = Achievement::query()
            ->withCount('userAchievements')
            ->orderByDesc('user_achievements_count')
            ->limit(5)
            ->get()
            ->map(fn (Achievement $a) => [
                'id' => $a->id,
                'name' => $a->name,
                'description' => $a->description,
                'requirement_type' => $a->requirement_type,
                'requirement_value' => $a->requirement_value,
                'users_count' => $a->user_achievements_count,
            ]);

        $quests = Quest::orderBy('title')->get(['id', 'title']);

        $latestTransactions = PointTransaction::query()
            ->with('user:id,name,email')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn (PointTransaction $tx) => [
                'id' => $tx->id,
                'user_id' => $tx->user_id,
                'amount' => $tx->amount,
                'transaction_type' => $tx->transaction_type,
                'reference_id' => $tx->reference_id,
                'created_at' => $tx->created_at?->format('Y-m-d\TH:i:s'),
                'user' => $tx->user ? ['id' => $tx->user->id, 'name' => $tx->user->name, 'email' => $tx->user->email] : null,
            ]);

        $latestActivityLogs = ActivityLog::query()
            ->with('user:id,name,email')
            ->orderByDesc('timestamp')
            ->limit(10)
            ->get()
            ->map(fn (ActivityLog $log) => [
                'id' => $log->id,
                'user_id' => $log->user_id,
                'action' => $log->action,
                'timestamp' => $log->timestamp?->format('Y-m-d\TH:i:s'),
                'user' => $log->user ? ['id' => $log->user->id, 'name' => $log->user->name, 'email' => $log->user->email] : null,
            ]);

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
            'achievementsWithCount' => $achievementsWithCount,
            'quests' => $quests,
            'latestTransactions' => $latestTransactions,
            'latestActivityLogs' => $latestActivityLogs,
        ]);
    }
}
