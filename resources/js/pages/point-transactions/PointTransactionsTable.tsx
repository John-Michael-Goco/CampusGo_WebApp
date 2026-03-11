import { Link } from '@inertiajs/react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import {
    Table,
    TableScroll,
    TableElement,
    tableHeadClass,
    tableCellClass,
    tableEmptyClass,
} from '@/components/ui/table';
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

const transactionsHeaderRowClass =
    'border-b border-emerald-200/60 bg-gradient-to-r from-emerald-50/90 to-emerald-50/50 dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-emerald-950/20 text-foreground';
const transactionsBodyRowClass =
    'border-b border-border/60 transition-colors hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 last:border-b-0';

export function PointTransactionsTable({
    transactions,
    pagination,
    filters,
    onSortByDate,
}: Props) {
    return (
        <>
            <Table className="border-emerald-200/60 dark:border-emerald-900/40 ring-1 ring-emerald-200/20 dark:ring-emerald-800/20">
                <TableScroll>
                    <TableElement>
                        <thead>
                            <tr className={transactionsHeaderRowClass}>
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
                                    User
                                </th>
                                <th className={tableHeadClass}>
                                    Type
                                </th>
                                <th className={`${tableHeadClass} text-right`}>
                                    Amount
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 ? (
                                <tr className={transactionsBodyRowClass}>
                                    <td
                                        colSpan={5}
                                        className={tableEmptyClass}
                                    >
                                        No point transactions found.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr
                                        key={tx.id}
                                        className={transactionsBodyRowClass}
                                    >
                                        <td className={`${tableCellClass} whitespace-nowrap text-muted-foreground`}>
                                            {formatDate(tx.created_at)}
                                        </td>
                                        <td className={`${tableCellClass} whitespace-nowrap text-muted-foreground`}>
                                            {formatTime(tx.created_at)}
                                        </td>
                                        <td className={tableCellClass}>
                                            <Link href={`/users/${tx.user_id}`} className="hover:underline text-primary">
                                                {tx.user?.name ?? '—'}
                                            </Link>
                                        </td>
                                        <td className={tableCellClass}>
                                            {getTransactionTypeLabel(tx.transaction_type)}
                                        </td>
                                        <td className={`${tableCellClass} text-right font-medium tabular-nums`}>
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
                    </TableElement>
                </TableScroll>
            </Table>

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
