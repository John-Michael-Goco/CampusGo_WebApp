import { Head, Link, router } from '@inertiajs/react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SimulationLeaderboardEntry = {
    rank: number;
    user_id: number;
    user_name: string;
    value: number;
};

export type SimulationLeaderboardPeriod =
    | 'today'
    | 'week'
    | 'month'
    | 'semester'
    | 'overall';

const PERIOD_LABELS: Record<SimulationLeaderboardPeriod, string> = {
    today: 'Today',
    week: 'Week',
    month: 'Month',
    semester: 'Semester',
    overall: 'Overall',
};

type Props = {
    entries: SimulationLeaderboardEntry[];
    period: SimulationLeaderboardPeriod;
    periods: SimulationLeaderboardPeriod[];
    value_label: string;
};

export default function SimulationLeaderboard({
    entries,
    period,
    periods,
    value_label,
}: Props) {
    const setPeriod = (p: SimulationLeaderboardPeriod) => {
        router.get('/simulation/leaderboard', { period: p }, { preserveState: true });
    };

    return (
        <>
            <Head title="Leaderboard (simulation)" />
            <div className="min-h-svh bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-start p-4 safe-area-padding">
                <div className="w-full max-w-[400px] min-h-[500px] bg-white dark:bg-zinc-800 rounded-[2rem] shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 flex flex-col">
                    <div className="h-10 shrink-0 bg-amber-500 dark:bg-amber-600 flex items-end justify-center pb-2">
                        <div className="w-24 h-1.5 rounded-full bg-black/20 dark:bg-white/20" />
                    </div>

                    <div className="flex-1 overflow-y-auto flex flex-col">
                        <div className="p-4 pb-2 flex flex-col items-center gap-1 border-b border-zinc-200 dark:border-zinc-700">
                            <div className="flex items-center justify-center gap-2">
                                <Trophy className="size-8 text-amber-600 dark:text-amber-400" />
                                <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                    Leaderboard
                                </h1>
                            </div>
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                Simulation — same data as app
                            </p>
                        </div>

                        <div className="p-3 border-b border-zinc-200 dark:border-zinc-700">
                            <div className="flex flex-wrap gap-1.5">
                                {periods.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPeriod(p)}
                                        className={cn(
                                            'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                            period === p
                                                ? 'bg-amber-500 text-white dark:bg-amber-600'
                                                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                                        )}
                                    >
                                        {PERIOD_LABELS[p]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 flex-1">
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                                {value_label}
                            </p>
                            {entries.length === 0 ? (
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
                                    No entries for this period.
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {entries.map((entry) => (
                                        <li
                                            key={`${entry.user_id}-${entry.rank}`}
                                            className="flex items-center gap-3 rounded-xl bg-zinc-100 dark:bg-zinc-700/50 px-4 py-3 border border-zinc-200 dark:border-zinc-600"
                                        >
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white dark:bg-amber-600">
                                                #{entry.rank}
                                            </span>
                                            <span className="flex-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                {entry.user_name}
                                            </span>
                                            <span className="text-sm font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                                                {entry.value.toLocaleString()}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col items-center gap-2 text-center">
                        <Link
                            href="/simulation/store"
                            className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                            Store (simulation)
                        </Link>
                        <Link
                            href="/simulation/transactions"
                            className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                            My transactions (simulation)
                        </Link>
                        <Link
                            href="/simulation/profile"
                            className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
                        >
                            My profile (simulation)
                        </Link>
                        <Link
                            href="/simulation/achievements"
                            className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
                        >
                            Achievements (simulation)
                        </Link>
                        <Link
                            href="/simulation/login"
                            className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline"
                        >
                            Student log in
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
