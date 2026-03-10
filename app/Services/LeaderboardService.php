<?php

namespace App\Services;

use App\Models\Leaderboard;
use App\Models\PointTransaction;
use App\Models\Semester;
use App\Models\User;
use Carbon\Carbon;

class LeaderboardService
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
     * Get leaderboard entries for a period. Reads from table, falls back to computed if empty.
     *
     * @return array{entries: array<int, array{rank: int, user_id: int, user_name: string, value: int}>, period: string, periods: array<string>, value_label: string}
     */
    public function getDataForPeriod(string $period): array
    {
        if (! in_array($period, self::PERIODS, true)) {
            $period = self::PERIOD_WEEK;
        }

        $entries = $this->getEntriesFromTable($period);
        if ($entries === null) {
            $entries = $this->getEntriesComputed($period);
        }

        return [
            'entries' => $entries,
            'period' => $period,
            'periods' => self::PERIODS,
            'value_label' => $period === self::PERIOD_OVERALL ? 'Total XP' : 'Quest points',
        ];
    }

    /**
     * @return array<int, array{rank: int, user_id: int, user_name: string, value: int}>|null
     */
    public function getEntriesFromTable(string $period): ?array
    {
        $periodKey = $this->getPeriodKey($period);
        if ($periodKey === null) {
            return null;
        }

        $rows = Leaderboard::query()
            ->where('period_type', $period)
            ->where('period_key', $periodKey)
            ->with('user:id,name,email')
            ->orderBy('rank')
            ->get();

        if ($rows->isEmpty()) {
            return null;
        }

        $entries = [];
        foreach ($rows as $row) {
            $entries[] = [
                'rank' => (int) $row->rank,
                'user_id' => (int) $row->user_id,
                'user_name' => $row->user?->name ?? $row->user?->email ?? '—',
                'value' => (int) $row->total_points,
            ];
        }
        return $entries;
    }

    public function getPeriodKey(string $period): ?string
    {
        $now = now();
        switch ($period) {
            case self::PERIOD_TODAY:
                return $now->format('Y-m-d');
            case self::PERIOD_WEEK:
                return $now->format('o-\WW');
            case self::PERIOD_MONTH:
                return $now->format('Y-m');
            case self::PERIOD_SEMESTER:
                $semester = Semester::current();
                return $semester ? (string) $semester->id : null;
            case self::PERIOD_OVERALL:
                return 'all';
            default:
                return null;
        }
    }

    /**
     * @return array<int, array{rank: int, user_id: int, user_name: string, value: int}>
     */
    public function getEntriesComputed(string $period): array
    {
        if ($period === self::PERIOD_OVERALL) {
            return $this->getOverallEntriesComputed();
        }
        return $this->getQuestRewardEntriesComputed($period);
    }

    /**
     * @return array<int, array{rank: int, user_id: int, user_name: string, value: int}>
     */
    private function getOverallEntriesComputed(): array
    {
        $users = User::query()
            ->where('role', 'student')
            ->select('id', 'name', 'email', 'total_xp_earned')
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
     * @return array<int, array{rank: int, user_id: int, user_name: string, value: int}>
     */
    private function getQuestRewardEntriesComputed(string $period): array
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
        switch ($period) {
            case self::PERIOD_TODAY:
                return [$now->copy()->startOfDay(), $now->copy()->endOfDay()];
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
