import { Head, router } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { LeaderboardPeriod, LeaderboardsPageProps } from './types';
import { PERIOD_LABELS } from './types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Leaderboards', href: '/leaderboards' },
];

export default function LeaderboardsIndex({
    entries,
    period,
    periods,
    valueLabel,
}: LeaderboardsPageProps) {
    const setPeriod = (p: LeaderboardPeriod) => {
        router.get('/leaderboards', { period: p }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leaderboards" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-semibold">Leaderboards</h1>
                    <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
                        {periods.map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setPeriod(p)}
                                className={cn(
                                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                    period === p
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                {PERIOD_LABELS[p]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="h-11 px-4 text-left font-medium">
                                        Rank
                                    </th>
                                    <th className="h-11 px-4 text-left font-medium">
                                        User
                                    </th>
                                    <th className="h-11 px-4 text-right font-medium">
                                        {valueLabel}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="h-24 px-4 text-center text-muted-foreground"
                                        >
                                            No entries for this period.
                                        </td>
                                    </tr>
                                ) : (
                                    entries.map((entry) => (
                                        <tr
                                            key={entry.user_id}
                                            className="border-b transition-colors hover:bg-muted/30"
                                        >
                                            <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums text-muted-foreground">
                                                #{entry.rank}
                                            </td>
                                            <td className="px-4 py-3">
                                                {entry.user_name}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium tabular-nums">
                                                {entry.value.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
