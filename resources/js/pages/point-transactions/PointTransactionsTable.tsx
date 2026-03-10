import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { Link } from '@inertiajs/react';
import type { PointTransactionItem, PointTransactionsFilters } from './types';
import { getTransactionTypeLabel } from './types';

type Props = {
    transactions: PointTransactionItem[];
    pagination: {
        total: number;
        current_page: number;
        per_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    filters: PointTransactionsFilters;
    onSortByDate: () => void;
};

function SortIcon({ sortDir }: { sortDir: 'asc' | 'desc' }) {
    return sortDir === 'asc' ? (
        <ArrowUp className="ml-1 size-4" />
    ) : (
        <ArrowDown className="ml-1 size-4" />
    );
}

function formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function formatTime(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

export function PointTransactionsTable({
    transactions,
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
                                        Date
                                        <SortIcon sortDir={filters.sort_dir} />
                                    </button>
                                </th>
                                <th className="h-11 px-4 text-left font-medium">
                                    Time
                                </th>
                                <th className="h-11 px-4 text-left font-medium">
                                    User
                                </th>
                                <th className="h-11 px-4 text-left font-medium">
                                    Type
                                </th>
                                <th className="h-11 px-4 text-right font-medium">
                                    Amount
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="h-24 px-4 text-center text-muted-foreground"
                                    >
                                        No point transactions found.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr
                                        key={tx.id}
                                        className="border-b transition-colors hover:bg-muted/30"
                                    >
                                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                                            {formatDate(tx.created_at)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                                            {formatTime(tx.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {tx.user?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {getTransactionTypeLabel(tx.transaction_type)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                                            {tx.amount >= 0 ? (
                                                <span className="text-green-600 dark:text-green-400">
                                                    +{tx.amount}
                                                </span>
                                            ) : (
                                                <span className="text-red-600 dark:text-red-400">
                                                    {tx.amount}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {pagination.total > 0 && (
                <div className="flex items-center justify-between gap-4 border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                        Showing{' '}
                        {(pagination.current_page - 1) * pagination.per_page + 1}{' '}
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
