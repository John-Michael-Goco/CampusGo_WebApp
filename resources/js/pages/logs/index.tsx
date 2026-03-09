import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { LogsFilters, LogsPageProps } from './types';
import { LogsFilters as LogsFiltersComponent } from './LogsFilters';
import { LogsTable } from './LogsTable';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Activity Logs', href: '/logs' },
    { title: 'Logs', href: '/logs' },
];

const defaultFilters: LogsFilters = {
    search: '',
    date_from: '',
    date_to: '',
    sort_dir: 'desc',
};

export default function LogsIndex({ logs, filters: rawFilters }: LogsPageProps) {
    const filters = { ...defaultFilters, ...rawFilters };
    const [search, setSearch] = useState(filters.search);
    const logItems = logs.data ?? [];
    const isInitialMount = useRef(true);

    const applyFilters = (overrides: Partial<LogsFilters> = {}) => {
        const next = { ...filters, ...overrides };
        router.get('/logs', {
            search: next.search || undefined,
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
            <Head title="Logs" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold">Activity Logs</h1>

                <LogsFiltersComponent
                    filters={filters}
                    search={search}
                    onSearchChange={setSearch}
                    onFiltersChange={applyFilters}
                />

                <LogsTable
                    logs={logItems}
                    pagination={{
                        total: logs.total,
                        current_page: logs.current_page,
                        per_page: logs.per_page,
                        last_page: logs.last_page,
                        prev_page_url: logs.prev_page_url,
                        next_page_url: logs.next_page_url,
                    }}
                    filters={filters}
                    onSortByDate={handleSortByDate}
                />
            </div>
        </AppLayout>
    );
}
