export type LeaderboardEntry = {
    rank: number;
    user_id: number;
    user_name: string;
    value: number;
};

export type LeaderboardPeriod =
    | 'today'
    | 'week'
    | 'month'
    | 'semester'
    | 'overall';

export const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
    today: 'Today',
    week: 'Week',
    month: 'Month',
    semester: 'Semester',
    overall: 'Overall',
};

export type LeaderboardsPageProps = {
    entries: LeaderboardEntry[];
    period: LeaderboardPeriod;
    periods: LeaderboardPeriod[];
    valueLabel: string;
};
