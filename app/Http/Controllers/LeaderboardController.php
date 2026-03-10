<?php

namespace App\Http\Controllers;

use App\Models\PointTransaction;
use App\Models\Semester;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeaderboardController extends Controller
{
    public const PERIOD_TODAY = 'today';
    public const PERIOD_WEEK = 'week';
    public const PERIOD_MONTH = 'month';
    public const PERIOD_SEMESTER = 'semester';
    public const PERIOD_OVERALL = 'overall';

    public const PERIODS = [
        self::PERIOD_TODAY,
        self::PERIOD_WEEK,
        self::PERIOD_MONTH,
        self::PERIOD_SEMESTER,
        self::PERIOD_OVERALL,
    ];

    /**
     * Display leaderboard for the selected period.
     * Today/Week/Month/Semester: total quest_reward points from point_transactions.
     * Overall: total_xp_earned from users.
     */
    public function index(Request $request): Response
    {
        $period = $request->query('period', self::PERIOD_WEEK);
        if (! in_array($period, self::PERIODS, true)) {
            $period = self::PERIOD_WEEK;
        }

        $entries = $this->getEntries($period);

        return Inertia::render('leaderboards/index', [
            'entries' => $entries,
            'period' => $period,
            'periods' => self::PERIODS,
            'valueLabel' => $period === self::PERIOD_OVERALL ? 'Total XP' : 'Quest points',
        ]);
    }

    /**
     * @return array<int, array{rank: int, user_id: int, user_name: string, value: int}>
     */
    private function getEntries(string $period): array
    {
        if ($period === self::PERIOD_OVERALL) {
            return $this->getOverallEntries();
        }

        return $this->getQuestRewardEntries($period);
    }

    /**
     * Overall: rank by users.total_xp_earned (all users, include zeros).
     *
     * @return array<int, array{rank: int, user_id: int, user_name: string, value: int}>
     */
    private function getOverallEntries(): array
    {
        $users = User::query()
            ->where('role', 'student')
            ->select('id', 'name', 'total_xp_earned')
            ->orderByDesc('total_xp_earned')
            ->get();

        $entries = [];
        $rank = 1;
        foreach ($users as $user) {
            $entries[] = [
                'rank' => $rank,
                'user_id' => $user->id,
                'user_name' => $user->name ?? $user->email ?? '—',
                'value' => (int) $user->total_xp_earned,
            ];
            $rank++;
        }

        return $entries;
    }

    /**
     * Today/Week/Month/Semester: sum of quest_reward amounts in the period.
     *
     * @return array<int, array{rank: int, user_id: int, user_name: string, value: int}>
     */
    private function getQuestRewardEntries(string $period): array
    {
        [$from, $to] = $this->getPeriodRange($period);
        if ($from === null || $to === null) {
            return [];
        }

        $rows = PointTransaction::query()
            ->where('point_transactions.transaction_type', PointTransaction::TYPE_QUEST_REWARD)
            ->whereBetween('point_transactions.created_at', [$from, $to])
            ->join('users', 'users.id', '=', 'point_transactions.user_id')
            ->selectRaw('point_transactions.user_id, users.name as user_name, COALESCE(SUM(point_transactions.amount), 0) as total')
            ->groupBy('point_transactions.user_id', 'users.name')
            ->orderByDesc('total')
            ->get();

        $entries = [];
        $rank = 1;
        foreach ($rows as $row) {
            $entries[] = [
                'rank' => $rank,
                'user_id' => (int) $row->user_id,
                'user_name' => $row->user_name ?? '—',
                'value' => (int) $row->total,
            ];
            $rank++;
        }

        return $entries;
    }

    /**
     * @return array{0: ?Carbon, 1: ?Carbon}
     */
    private function getPeriodRange(string $period): array
    {
        $now = now();
        $today = $now->copy()->startOfDay();
        $endOfToday = $now->copy()->endOfDay();

        switch ($period) {
            case self::PERIOD_TODAY:
                return [$today, $endOfToday];
            case self::PERIOD_WEEK:
                return [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()];
            case self::PERIOD_MONTH:
                return [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()];
            case self::PERIOD_SEMESTER:
                $semester = Semester::current();
                if (! $semester || ! $semester->start_date || ! $semester->end_date) {
                    return [null, null];
                }
                $from = Carbon::parse($semester->start_date)->startOfDay();
                $to = Carbon::parse($semester->end_date)->endOfDay();
                return [$from, $to];
            default:
                return [null, null];
        }
    }
}
