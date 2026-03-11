import { Head, Link } from '@inertiajs/react';
import { Award, Calendar, ClipboardList, GraduationCap, ScrollText, Swords, Trophy } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';

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

export type AchievementWithCount = {
    id: number;
    name: string;
    description: string | null;
    requirement_type: string;
    requirement_value: number;
    users_count: number;
};

export type QuestOption = { id: number; title: string };

export type LatestTransaction = {
    id: number;
    user_id: number;
    amount: number;
    transaction_type: string;
    reference_id: number | null;
    created_at: string | null;
    user: { id: number; name: string; email?: string } | null;
};

export type LatestActivityLog = {
    id: number;
    user_id: number;
    action: string;
    timestamp: string | null;
    user: { id: number; name: string; email?: string } | null;
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
    achievementsWithCount: AchievementWithCount[];
    quests: QuestOption[];
    latestTransactions: LatestTransaction[];
    latestActivityLogs: LatestActivityLog[];
};

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
    quest_reward: 'Quest reward',
    buy_in: 'Buy in',
    store_redeem: 'Store redeem',
    buy_in_refund: 'Buy in refund',
    transfer_in: 'Transfer in',
    transfer_out: 'Transfer out',
};

const ACTION_LABELS: Record<string, string> = {
    student_created: 'Student created',
    professor_created: 'Professor created',
    gamemaster_created: 'Gamemaster created',
    gamemaster_updated: 'Gamemaster updated',
    user_deleted: 'User deleted',
    achievement_created: 'Achievement created',
    achievement_updated: 'Achievement updated',
    achievement_deleted: 'Achievement deleted',
    achievement_earned: 'Achievement earned',
    store_item_created: 'Store item created',
    store_redeem: 'Store redeem',
    semester_created: 'Semester created',
    semester_updated: 'Semester updated',
    semester_deleted: 'Semester deleted',
    quest_created: 'Quest created',
    quest_updated: 'Quest updated',
    quest_deleted: 'Quest deleted',
    quest_joined: 'Quest joined',
    quest_stage_submitted: 'Quest stage submitted',
    points_transfer_out: 'Transfer out',
    points_transfer_in: 'Transfer in',
};

const REQUIREMENT_LABELS: Record<string, string> = {
    quest_count: 'Quest count',
    level: 'Level',
    quest_win: 'Quests won',
    complete_quest: 'Complete quest',
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

function formatDateTime(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getTransactionTypeLabel(type: string): string {
    return TRANSACTION_TYPE_LABELS[type] ?? type;
}

function getActionDisplayLabel(action: string): string {
    const colon = action.indexOf(':');
    const key = colon >= 0 ? action.slice(0, colon).trim() : action.trim();
    const detail = colon >= 0 ? action.slice(colon + 1).trim() : null;
    const label = ACTION_LABELS[key] ?? key;
    return detail ? `${label}: ${detail}` : label;
}

function requirementDisplay(a: AchievementWithCount, quests: QuestOption[]): string {
    const label = REQUIREMENT_LABELS[a.requirement_type] ?? a.requirement_type;
    if (a.requirement_type === 'complete_quest') {
        const q = quests.find((x) => x.id === a.requirement_value);
        return q ? `${label}: ${q.title}` : `${label}: #${a.requirement_value}`;
    }
    return `${label}: ${a.requirement_value}`;
}

export default function Dashboard({
    currentSemester,
    studentsCount,
    activeQuestsCount,
    leaderboardToday,
    achievementsWithCount,
    quests,
    latestTransactions,
    latestActivityLogs,
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

                {/* Bottom: Top 5 leaderboard (today) + Top 5 achievements — same height */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-stretch">
                    {/* Left: Top 5 leaderboard — Today only */}
                    <div className="flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50/50 to-white shadow-sm dark:border-violet-900/50 dark:from-violet-950/20 dark:to-card">
                        <div className="flex shrink-0 items-center gap-2 border-b border-violet-200/60 px-4 py-3 dark:border-violet-900/50">
                            <Trophy className="size-5 text-violet-600 dark:text-violet-400" aria-hidden />
                            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                                Top 5 leaderboard — Today
                            </h2>
                            <Link
                                href="/leaderboards"
                                className="ml-auto text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
                            >
                                View all →
                            </Link>
                        </div>
                        <div className="min-h-[220px] flex-1 p-4">
                            {leaderboardToday.length === 0 ? (
                                <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                                    No entries for today.
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {leaderboardToday.map((e) => (
                                        <li
                                            key={`${e.user_id}-${e.rank}`}
                                            className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm dark:border-slate-700/50 dark:bg-slate-800/30"
                                        >
                                            <span className="flex items-center gap-2 truncate">
                                                <span className="tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                                                    #{e.rank}
                                                </span>
                                                <Link
                                                    href={`/users/${e.user_id}`}
                                                    className="truncate text-slate-700 hover:underline dark:text-slate-300"
                                                >
                                                    {e.user_name}
                                                </Link>
                                            </span>
                                            <span className="shrink-0 tabular-nums font-medium text-slate-600 dark:text-slate-400">
                                                {e.value.toLocaleString()} pts
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                Quest reward points today
                            </p>
                        </div>
                    </div>

                    {/* Right: Top 5 achievements by users earned — same height */}
                    <div className="flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border border-rose-200/60 bg-gradient-to-br from-rose-50/50 to-white shadow-sm dark:border-rose-900/50 dark:from-rose-950/20 dark:to-card">
                        <div className="flex shrink-0 items-center gap-2 border-b border-rose-200/60 px-4 py-3 dark:border-rose-900/50">
                            <Award className="size-5 text-rose-600 dark:text-rose-400" aria-hidden />
                            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                                Top achievements
                            </h2>
                            <Link
                                href="/achievements"
                                className="ml-auto text-sm font-medium text-rose-600 hover:underline dark:text-rose-400"
                            >
                                View all →
                            </Link>
                        </div>
                        <div className="min-h-[220px] flex-1 overflow-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200/80 bg-slate-50/80 dark:border-slate-700/60 dark:bg-slate-800/50">
                                        <th className="h-9 px-3 py-1.5 text-left font-medium text-slate-700 dark:text-slate-300">
                                            Achievement
                                        </th>
                                        <th className="h-9 px-3 py-1.5 text-left font-medium text-slate-700 dark:text-slate-300">
                                            Requirement
                                        </th>
                                        <th className="h-9 px-3 py-1.5 text-right font-medium text-slate-700 dark:text-slate-300">
                                            Earned
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {achievementsWithCount.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="px-3 py-4 text-center text-slate-500 dark:text-slate-400"
                                            >
                                                No achievements yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        achievementsWithCount.map((a) => (
                                            <tr
                                                key={a.id}
                                                className="border-b border-slate-100 transition-colors hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/30"
                                            >
                                                <td className="px-3 py-2">
                                                    <span className="font-medium text-slate-800 dark:text-slate-200">
                                                        {a.name}
                                                    </span>
                                                    {a.description && (
                                                        <p className="mt-0.5 max-w-[180px] truncate text-xs text-slate-500 dark:text-slate-400">
                                                            {a.description}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="max-w-[140px] truncate px-3 py-2 text-slate-600 dark:text-slate-400">
                                                    {requirementDisplay(a, quests)}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums font-medium text-rose-600 dark:text-rose-400">
                                                    {a.users_count}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Latest 10 point transactions + Latest 10 activity logs */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-stretch">
                    {/* Left: Latest 10 point transactions */}
                    <div className="flex min-h-[280px] flex-col overflow-hidden rounded-2xl border border-sky-200/60 bg-gradient-to-br from-sky-50/50 to-white shadow-sm dark:border-sky-900/50 dark:from-sky-950/20 dark:to-card">
                        <div className="flex shrink-0 items-center gap-2 border-b border-sky-200/60 px-4 py-3 dark:border-sky-900/50">
                            <ClipboardList className="size-5 text-sky-600 dark:text-sky-400" aria-hidden />
                            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                                Latest point transactions
                            </h2>
                            <Link
                                href="/point-transactions"
                                className="ml-auto text-sm font-medium text-sky-600 hover:underline dark:text-sky-400"
                            >
                                View all →
                            </Link>
                        </div>
                        <div className="min-h-0 flex-1 overflow-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200/80 bg-slate-50/80 dark:border-slate-700/60 dark:bg-slate-800/50">
                                        <th className="h-9 px-3 py-1.5 text-left font-medium text-slate-700 dark:text-slate-300">
                                            User
                                        </th>
                                        <th className="h-9 px-3 py-1.5 text-left font-medium text-slate-700 dark:text-slate-300">
                                            Type
                                        </th>
                                        <th className="h-9 px-3 py-1.5 text-right font-medium text-slate-700 dark:text-slate-300">
                                            Amount
                                        </th>
                                        <th className="h-9 px-3 py-1.5 text-right font-medium text-slate-700 dark:text-slate-300">
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {latestTransactions.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-3 py-4 text-center text-slate-500 dark:text-slate-400"
                                            >
                                                No transactions yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        latestTransactions.map((tx) => (
                                            <tr
                                                key={tx.id}
                                                className="border-b border-slate-100 transition-colors hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/30"
                                            >
                                                <td className="max-w-[120px] truncate px-3 py-2">
                                                    <Link
                                                        href={`/users/${tx.user_id}`}
                                                        className="text-slate-700 hover:underline dark:text-slate-300"
                                                    >
                                                        {tx.user?.name ?? tx.user?.email ?? '—'}
                                                    </Link>
                                                </td>
                                                <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                                                    {getTransactionTypeLabel(tx.transaction_type)}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums font-medium">
                                                    <span className={tx.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                                        {tx.amount >= 0 ? '+' : ''}{tx.amount}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2 text-right text-xs text-slate-500 dark:text-slate-400">
                                                    {formatDateTime(tx.created_at)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right: Latest 10 activity logs */}
                    <div className="flex min-h-[280px] flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50/50 to-white shadow-sm dark:border-slate-700/50 dark:from-slate-900/20 dark:to-card">
                        <div className="flex shrink-0 items-center gap-2 border-b border-slate-200/60 px-4 py-3 dark:border-slate-700/60">
                            <ScrollText className="size-5 text-slate-600 dark:text-slate-400" aria-hidden />
                            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                                Latest activity logs
                            </h2>
                            <Link
                                href="/logs"
                                className="ml-auto text-sm font-medium text-slate-600 hover:underline dark:text-slate-400"
                            >
                                View all →
                            </Link>
                        </div>
                        <div className="min-h-0 flex-1 overflow-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200/80 bg-slate-50/80 dark:border-slate-700/60 dark:bg-slate-800/50">
                                        <th className="h-9 px-3 py-1.5 text-left font-medium text-slate-700 dark:text-slate-300">
                                            User
                                        </th>
                                        <th className="h-9 px-3 py-1.5 text-left font-medium text-slate-700 dark:text-slate-300">
                                            Action
                                        </th>
                                        <th className="h-9 px-3 py-1.5 text-right font-medium text-slate-700 dark:text-slate-300">
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {latestActivityLogs.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="px-3 py-4 text-center text-slate-500 dark:text-slate-400"
                                            >
                                                No activity logs yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        latestActivityLogs.map((log) => (
                                            <tr
                                                key={log.id}
                                                className="border-b border-slate-100 transition-colors hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/30"
                                            >
                                                <td className="max-w-[120px] truncate px-3 py-2">
                                                    <Link
                                                        href={`/users/${log.user_id}`}
                                                        className="text-slate-700 hover:underline dark:text-slate-300"
                                                    >
                                                        {log.user?.name ?? log.user?.email ?? '—'}
                                                    </Link>
                                                </td>
                                                <td className="max-w-[200px] truncate px-3 py-2 text-slate-600 dark:text-slate-400" title={log.action}>
                                                    {getActionDisplayLabel(log.action)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2 text-right text-xs text-slate-500 dark:text-slate-400">
                                                    {formatDateTime(log.timestamp)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
