import { Head, Link } from '@inertiajs/react';
import { Award, Calendar, GraduationCap, Swords, Trophy } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
];

export type LeaderboardEntry = {
    rank: number;
    user_id: number;
    user_name: string;
    value: number;
};

export type TopAchieverEntry = {
    id: number;
    name: string;
    achievements_count: number;
};

export type DashboardProps = {
    currentSemester: {
        id: number;
        name: string;
        start_date: string;
        end_date: string;
    } | null;
    studentsCount: number;
    activeQuestsCount: number;
    leaderboardToday: LeaderboardEntry[];
    topAchievers: TopAchieverEntry[];
};

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default function Dashboard({
    currentSemester,
    studentsCount,
    activeQuestsCount,
    leaderboardToday,
    topAchievers,
}: DashboardProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-6 md:grid-cols-3">
                    {/* Card 1: Current semester — blue accent */}
                    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50/80 to-white shadow-sm transition-shadow hover:shadow-md dark:border-blue-900/50 dark:from-blue-950/30 dark:to-card dark:shadow-blue-950/10">
                        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-500 to-blue-400 dark:from-blue-400 dark:to-blue-600" />
                        <div className="flex items-center gap-3 px-5 py-4 pl-6">
                            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-400">
                                <Calendar className="size-6" aria-hidden />
                            </div>
                            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                                Current semester
                            </h2>
                        </div>
                        <div className="flex flex-1 flex-col px-5 pb-5 pl-6">
                            {currentSemester ? (
                                <>
                                    <p className="text-xl font-semibold text-slate-900 dark:text-white">
                                        {currentSemester.name}
                                    </p>
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                        {formatDate(currentSemester.start_date)} –{' '}
                                        {formatDate(currentSemester.end_date)}
                                    </p>
                                    <Link
                                        href={`/semesters/${currentSemester.id}`}
                                        className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                        View semester →
                                    </Link>
                                </>
                            ) : (
                                <p className="text-slate-600 dark:text-slate-400">
                                    No current semester. Today is outside all semester date ranges.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Card 2: Students — emerald accent */}
                    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-white shadow-sm transition-shadow hover:shadow-md dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-card dark:shadow-emerald-950/10">
                        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-emerald-500 to-emerald-400 dark:from-emerald-400 dark:to-emerald-600" />
                        <div className="flex items-center gap-3 px-5 py-4 pl-6">
                            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-400">
                                <GraduationCap className="size-6" aria-hidden />
                            </div>
                            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                                Students
                            </h2>
                        </div>
                        <div className="flex flex-1 flex-col px-5 pb-5 pl-6">
                            <p className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                                {studentsCount}
                            </p>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                Users with student role
                            </p>
                            <Link
                                href="/users?role=student"
                                className="mt-4 inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                            >
                                View all students →
                            </Link>
                        </div>
                    </div>

                    {/* Card 3: Active quests — amber accent */}
                    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-white shadow-sm transition-shadow hover:shadow-md dark:border-amber-900/50 dark:from-amber-950/30 dark:to-card dark:shadow-amber-950/10">
                        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-500 to-amber-400 dark:from-amber-400 dark:to-amber-600" />
                        <div className="flex items-center gap-3 px-5 py-4 pl-6">
                            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-400">
                                <Swords className="size-6" aria-hidden />
                            </div>
                            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                                Active quests
                            </h2>
                        </div>
                        <div className="flex flex-1 flex-col px-5 pb-5 pl-6">
                            <p className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                                {activeQuestsCount}
                            </p>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                Approved, upcoming or ongoing
                            </p>
                            <Link
                                href="/quests/active"
                                className="mt-4 inline-flex items-center text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                            >
                                View all active quests →
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom: Top 10 leaderboard (today) + Top achievers — same height */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-stretch">
                    {/* Left: Top 10 leaderboard — Today only */}
                    <div className="flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50/50 to-white shadow-sm dark:border-violet-900/50 dark:from-violet-950/20 dark:to-card">
                        <div className="flex shrink-0 items-center gap-2 border-b border-violet-200/60 px-4 py-3 dark:border-violet-900/50">
                            <Trophy className="size-5 text-violet-600 dark:text-violet-400" aria-hidden />
                            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                                Top 10 leaderboard — Today
                            </h2>
                            <Link
                                href="/leaderboards"
                                className="ml-auto text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
                            >
                                View all →
                            </Link>
                        </div>
                        <div className="min-h-[220px] flex-1 p-4">
                            <ul className="space-y-2">
                                {Array.from({ length: 10 }, (_, i) => {
                                    const e = leaderboardToday[i];
                                    return (
                                        <li
                                            key={e ? `${e.user_id}-${e.rank}` : `leaderboard-empty-${i}`}
                                            className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm dark:border-slate-700/50 dark:bg-slate-800/30"
                                        >
                                            <span className="flex items-center gap-2 truncate">
                                                <span className="tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                                                    #{i + 1}
                                                </span>
                                                {e ? (
                                                    <Link
                                                        href={`/users/${e.user_id}`}
                                                        className="truncate text-slate-700 hover:underline dark:text-slate-300"
                                                    >
                                                        {e.user_name}
                                                    </Link>
                                                ) : (
                                                    <span className="truncate text-slate-400 dark:text-slate-500">—</span>
                                                )}
                                            </span>
                                            <span className="shrink-0 tabular-nums font-medium text-slate-600 dark:text-slate-400">
                                                {e ? `${e.value.toLocaleString()} pts` : '—'}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                Quest reward points today
                            </p>
                        </div>
                    </div>

                    {/* Right: Top achievers — students and how many achievements they unlocked */}
                    <div className="flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border border-rose-200/60 bg-gradient-to-br from-rose-50/50 to-white shadow-sm dark:border-rose-900/50 dark:from-rose-950/20 dark:to-card">
                        <div className="flex shrink-0 items-center gap-2 border-b border-rose-200/60 px-4 py-3 dark:border-rose-900/50">
                            <Award className="size-5 text-rose-600 dark:text-rose-400" aria-hidden />
                            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                                Top achievers
                            </h2>
                            <Link
                                href="/achievements"
                                className="ml-auto text-sm font-medium text-rose-600 hover:underline dark:text-rose-400"
                            >
                                View all →
                            </Link>
                        </div>
                        <div className="min-h-[220px] flex-1 p-4">
                            <ul className="space-y-2">
                                {Array.from({ length: 10 }, (_, i) => {
                                    const entry = topAchievers[i];
                                    return (
                                        <li
                                            key={entry ? entry.id : `achievers-empty-${i}`}
                                            className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm dark:border-slate-700/50 dark:bg-slate-800/30"
                                        >
                                            <span className="flex items-center gap-2 truncate">
                                                <span className="tabular-nums font-semibold text-rose-600 dark:text-rose-400">
                                                    #{i + 1}
                                                </span>
                                                {entry ? (
                                                    <Link
                                                        href={`/users/${entry.id}`}
                                                        className="truncate text-slate-700 hover:underline dark:text-slate-300"
                                                    >
                                                        {entry.name}
                                                    </Link>
                                                ) : (
                                                    <span className="truncate text-slate-400 dark:text-slate-500">—</span>
                                                )}
                                            </span>
                                            <span className="shrink-0 tabular-nums font-medium text-slate-600 dark:text-slate-400">
                                                {entry
                                                    ? `${entry.achievements_count} ${entry.achievements_count === 1 ? 'achievement' : 'achievements'}`
                                                    : '—'}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
