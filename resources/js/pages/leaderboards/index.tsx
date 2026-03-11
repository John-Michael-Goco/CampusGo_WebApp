import { Head, Link, router } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    Table,
    TableScroll,
    TableElement,
    tableHeaderRowClass,
    tableBodyRowClass,
    tableHeadClass,
    tableCellClass,
    tableEmptyClass,
} from '@/components/ui/table';
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

                <Table>
                    <TableScroll>
                        <TableElement>
                            <thead>
                                <tr className={tableHeaderRowClass}>
                                    <th className={tableHeadClass}>
                                        Rank
                                    </th>
                                    <th className={tableHeadClass}>
                                        User
                                    </th>
                                    <th className={cn(tableHeadClass, 'text-right')}>
                                        {valueLabel}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.length === 0 ? (
                                    <tr className={tableBodyRowClass}>
                                        <td
                                            colSpan={3}
                                            className={tableEmptyClass}
                                        >
                                            No entries for this period.
                                        </td>
                                    </tr>
                                ) : (
                                    entries.map((entry) => (
                                        <tr
                                            key={entry.user_id}
                                            className={tableBodyRowClass}
                                        >
                                            <td className={cn(tableCellClass, 'whitespace-nowrap font-medium tabular-nums text-muted-foreground')}>
                                                #{entry.rank}
                                            </td>
                                            <td className={tableCellClass}>
                                                <Link href={`/users/${entry.user_id}`} className="hover:underline font-medium text-primary">
                                                    {entry.user_name}
                                                </Link>
                                            </td>
                                            <td className={cn(tableCellClass, 'text-right font-medium tabular-nums')}>
                                                {entry.value.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </TableElement>
                    </TableScroll>
                </Table>
            </div>
        </AppLayout>
    );
}
