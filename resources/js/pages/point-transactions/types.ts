export type PointTransactionItem = {
    id: number;
    user_id: number;
    amount: number;
    transaction_type: string;
    reference_id: number | null;
    created_at: string;
    user: { id: number; name: string; email?: string } | null;
};

export type PointTransactionsFilters = {
    search: string;
    user_id: string;
    date_from: string;
    date_to: string;
    sort_dir: 'asc' | 'desc';
};

export type FilterUser = {
    id: number;
    name: string;
};

export type PaginatedPointTransactions = {
    data: PointTransactionItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

export type PointTransactionsPageProps = {
    transactions: PaginatedPointTransactions;
    filterUsers: FilterUser[];
    filters: PointTransactionsFilters;
};

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
    quest_reward: 'Quest reward',
    buy_in: 'Buy in',
    store_redeem: 'Store redeem',
    buy_in_refund: 'Buy in refund',
    transfer_in: 'Transfer in',
    transfer_out: 'Transfer out',
};

export function getTransactionTypeLabel(type: string): string {
    return TRANSACTION_TYPE_LABELS[type] ?? type;
}
