import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { Link } from '@inertiajs/react';
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

export function LogsTable({
    logs,
    pagination,
    filters,
    onSortByDate,
}: Props) {
    return (
        <>
            <div className="overflow-hidden rounded-lg border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="h-11 px-4 text-left font-medium">
                                    <button
                                        type="button"
                                        className="inline-flex items-center hover:underline"
                                        onClick={onSortByDate}
                                    >
                                        Date & time
                                        <SortIcon sortDir={filters.sort_dir} />
                                    </button>
                                </th>
                                <th className="h-11 px-4 text-left font-medium">
                                    Action
                                </th>
                                <th className="h-11 px-4 text-left font-medium">
                                    By
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={3}
                                        className="h-24 px-4 text-center text-muted-foreground"
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
                                            className="border-b transition-colors hover:bg-muted/30"
                                        >
                                            <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                                                {log.timestamp
                                                    ? new Date(
                                                          log.timestamp
                                                      ).toLocaleString()
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {getActionDisplayLabel(
                                                    log.action
                                                )}
                                                {showDetailSuffix && (
                                                    <span className="ml-1 text-muted-foreground">
                                                        — {detail}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {log.user?.name ?? '—'}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
