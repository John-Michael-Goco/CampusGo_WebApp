import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { Link } from '@inertiajs/react';
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
import type { LogEntry, LogsFilters } from './types';
import { getActionDetail, getActionDisplayLabel, getActionKey } from './types';

type Props = {
    logs: LogEntry[];
    pagination: {
        total: number;
        current_page: number;
        per_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    filters: LogsFilters;
    onSortByDate: () => void;
};

function SortIcon({ sortDir }: { sortDir: 'asc' | 'desc' }) {
    return sortDir === 'asc' ? (
        <ArrowUp className="ml-1 size-4" />
    ) : (
        <ArrowDown className="ml-1 size-4" />
    );
}

function formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function formatTime(iso: string | null | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

export function LogsTable({
    logs,
    pagination,
    filters,
    onSortByDate,
}: Props) {
    return (
        <>
            <Table>
                <TableScroll>
                    <TableElement>
                        <thead>
                            <tr className={tableHeaderRowClass}>
                                <th className={tableHeadClass}>
                                    <button
                                        type="button"
                                        className="inline-flex items-center hover:underline"
                                        onClick={onSortByDate}
                                    >
                                        Date
                                        <SortIcon sortDir={filters.sort_dir} />
                                    </button>
                                </th>
                                <th className={tableHeadClass}>
                                    Time
                                </th>
                                <th className={tableHeadClass}>
                                    Action
                                </th>
                                <th className={tableHeadClass}>
                                    By
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 ? (
                                <tr className={tableBodyRowClass}>
                                    <td
                                        colSpan={4}
                                        className={tableEmptyClass}
                                    >
                                        No logs yet.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => {
                                    const detail = getActionDetail(log.action);
                                    const actionKey = getActionKey(log.action);
                                    const showDetailSuffix = detail != null && actionKey !== 'item_used';
                                    return (
                                        <tr
                                            key={log.id}
                                            className={tableBodyRowClass}
                                        >
                                            <td className={`${tableCellClass} whitespace-nowrap text-muted-foreground`}>
                                                {formatDate(log.timestamp)}
                                            </td>
                                            <td className={`${tableCellClass} whitespace-nowrap text-muted-foreground`}>
                                                {formatTime(log.timestamp)}
                                            </td>
                                            <td className={tableCellClass}>
                                                {getActionDisplayLabel(
                                                    log.action
                                                )}
                                                {showDetailSuffix && (
                                                    <span className="ml-1 text-muted-foreground">
                                                        — {detail}
                                                    </span>
                                                )}
                                            </td>
                                            <td className={tableCellClass}>
                                                <Link href={`/users/${log.user_id}`} className="hover:underline text-primary">
                                                    {log.user?.name ?? '—'}
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </TableElement>
                </TableScroll>
            </Table>

            {pagination.total > 0 && (
                <div className="flex items-center justify-between gap-4 border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                        Showing{' '}
                        {(pagination.current_page - 1) * pagination.per_page +
                            1}{' '}
                        to{' '}
                        {Math.min(
                            pagination.current_page * pagination.per_page,
                            pagination.total
                        )}{' '}
                        of {pagination.total} entries
                    </p>
                    {pagination.last_page > 1 && (
                        <div className="flex items-center gap-2">
                            {pagination.prev_page_url ? (
                                <Link
                                    href={pagination.prev_page_url}
                                    preserveState
                                    className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                                >
                                    <ArrowLeft className="size-4" />
                                    Previous
                                </Link>
                            ) : (
                                <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-transparent bg-muted/50 px-3 py-2 text-sm font-medium text-muted-foreground">
                                    <ArrowLeft className="size-4" />
                                    Previous
                                </span>
                            )}
                            <span className="text-sm text-muted-foreground">
                                Page {pagination.current_page} of{' '}
                                {pagination.last_page}
                            </span>
                            {pagination.next_page_url ? (
                                <Link
                                    href={pagination.next_page_url}
                                    preserveState
                                    className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                                >
                                    Next
                                    <ArrowRight className="size-4" />
                                </Link>
                            ) : (
                                <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-transparent bg-muted/50 px-3 py-2 text-sm font-medium text-muted-foreground">
                                    Next
                                    <ArrowRight className="size-4" />
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
