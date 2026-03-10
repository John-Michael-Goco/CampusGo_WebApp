import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type {
    PointTransactionsFilters,
    PointTransactionsPageProps,
} from './types';
import { PointTransactionsFilters as PointTransactionsFiltersComponent } from './PointTransactionsFilters';
import { PointTransactionsTable } from './PointTransactionsTable';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Logs and Transactions', href: '/logs' },
    { title: 'Points Transactions', href: '/transactions' },
];

const defaultFilters: PointTransactionsFilters = {
    search: '',
    user_id: '',
    date_from: '',
    date_to: '',
    sort_dir: 'desc',
};

export default function PointTransactionsIndex({
    transactions,
    filterUsers,
    filters: rawFilters,
}: PointTransactionsPageProps) {
    const filters = { ...defaultFilters, ...rawFilters };
    const [search, setSearch] = useState(filters.search);
    const transactionItems = transactions.data ?? [];
    const isInitialMount = useRef(true);

    const applyFilters = (overrides: Partial<PointTransactionsFilters> = {}) => {
        const next = { ...filters, ...overrides };
        router.get('/transactions', {
            search: next.search || undefined,
            user_id: next.user_id || undefined,
            date_from: next.date_from || undefined,
            date_to: next.date_to || undefined,
            sort_dir: next.sort_dir,
        }, { preserveState: true });
    };

    useEffect(() => {
        setSearch(filters.search);
    }, [filters.search]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        const t = setTimeout(() => {
            applyFilters({ search });
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    const handleSortByDate = () => {
        const nextDir = filters.sort_dir === 'asc' ? 'desc' : 'asc';
        applyFilters({ sort_dir: nextDir });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Points Transactions" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold">Points Transactions</h1>

                <PointTransactionsFiltersComponent
                    filters={filters}
                    search={search}
                    onSearchChange={setSearch}
                    onFiltersChange={applyFilters}
                    filterUsers={filterUsers}
                />

                <PointTransactionsTable
                    transactions={transactionItems}
                    pagination={{
                        total: transactions.total,
                        current_page: transactions.current_page,
                        per_page: transactions.per_page,
                        last_page: transactions.last_page,
                        prev_page_url: transactions.prev_page_url,
                        next_page_url: transactions.next_page_url,
                    }}
                    filters={filters}
                    onSortByDate={handleSortByDate}
                />
            </div>
        </AppLayout>
    );
}
