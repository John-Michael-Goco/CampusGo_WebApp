import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Calendar, Search } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type LogEntry = {
    id: number;
    user_id: number;
    action: string;
    description: string | null;
    reference_id: number | null;
    created_at: string;
    user: { id: number; name: string } | null;
};

export type LogsFilters = {
    search: string;
    date_from: string;
    date_to: string;
    sort_dir: 'asc' | 'desc';
};

type PaginatedLogs = {
    data: LogEntry[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

type Props = {
    logs: PaginatedLogs;
    filters?: Partial<LogsFilters>;
};

function actionLabel(action: string): string {
    switch (action) {
        case 'student_created':
            return 'Student created';
        case 'professor_created':
            return 'Professor created';
        case 'gamemaster_created':
            return 'Gamemaster created';
        case 'auth_signin':
            return 'Signed in (API)';
        case 'auth_signup':
            return 'Registered (API)';
        case 'auth_signout':
            return 'Signed out (API)';
        default:
            return action;
    }
}

function SortIcon({ sortDir }: { sortDir: 'asc' | 'desc' }) {
    return sortDir === 'asc' ? (
        <ArrowUp className="ml-1 size-4" />
    ) : (
        <ArrowDown className="ml-1 size-4" />
    );
}

const defaultFilters: LogsFilters = {
    search: '',
    date_from: '',
    date_to: '',
    sort_dir: 'desc',
};

export default function LogsIndex({ logs, filters: rawFilters }: Props) {
    const filters = { ...defaultFilters, ...rawFilters };
    const [search, setSearch] = useState(filters.search);
    const logItems = logs.data ?? [];
    const isInitialMount = useRef(true);

    const buildQuery = (overrides: Partial<LogsFilters> = {}) => {
        const f = { ...filters, ...overrides };
        return {
            search: f.search || undefined,
            date_from: f.date_from || undefined,
            date_to: f.date_to || undefined,
            sort_dir: f.sort_dir,
        };
    };

    const applyFilters = (overrides: Partial<LogsFilters> = {}) => {
        router.get('/logs', buildQuery(overrides), { preserveState: true });
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
        const nextDir =
            filters.sort_dir === 'asc' ? 'desc' : 'asc';
        applyFilters({ sort_dir: nextDir });
    };

    const hasDateFilter = filters.date_from || filters.date_to;

    return (
        <AppLayout>
            <Head title="Logs" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold">Activity Logs</h1>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by action, description, or user..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Calendar className="mr-2 size-4" />
                                Calendar
                                {hasDateFilter && (
                                    <span className="ml-2 size-2 rounded-full bg-primary" />
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 p-3">
                            <div className="space-y-3">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                        From
                                    </label>
                                    <Input
                                        type="date"
                                        value={filters.date_from}
                                        onChange={(e) =>
                                            applyFilters({ date_from: e.target.value })
                                        }
                                        className="relative w-full pr-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                        To
                                    </label>
                                    <Input
                                        type="date"
                                        value={filters.date_to}
                                        onChange={(e) =>
                                            applyFilters({ date_to: e.target.value })
                                        }
                                        className="relative w-full pr-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2"
                                    />
                                </div>
                                {hasDateFilter && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full"
                                        onClick={() =>
                                            applyFilters({
                                                date_from: '',
                                                date_to: '',
                                            })
                                        }
                                    >
                                        Clear dates
                                    </Button>
                                )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="rounded-lg border bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="h-11 px-4 text-left font-medium">
                                        <button
                                            type="button"
                                            className="inline-flex items-center hover:underline"
                                            onClick={handleSortByDate}
                                        >
                                            Date & time
                                            <SortIcon sortDir={filters.sort_dir} />
                                        </button>
                                    </th>
                                    <th className="h-11 px-4 text-left font-medium">
                                        Action
                                    </th>
                                    <th className="h-11 px-4 text-left font-medium">
                                        Description
                                    </th>
                                    <th className="h-11 px-4 text-left font-medium">
                                        By
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {logItems.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="h-24 px-4 text-center text-muted-foreground"
                                        >
                                            No logs yet.
                                        </td>
                                    </tr>
                                ) : (
                                    logItems.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="border-b transition-colors hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                                {log.created_at
                                                    ? new Date(
                                                          log.created_at
                                                      ).toLocaleString()
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {actionLabel(log.action)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {log.description ?? '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {log.user?.name ?? '—'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {logs.total > 0 && (
                    <div className="flex items-center justify-between gap-4 border-t pt-4">
                        <p className="text-sm text-muted-foreground">
                            Showing {(logs.current_page - 1) * logs.per_page + 1} to{' '}
                            {Math.min(logs.current_page * logs.per_page, logs.total)} of{' '}
                            {logs.total} entries
                        </p>
                        {logs.last_page > 1 && (
                            <div className="flex items-center gap-2">
                                {logs.prev_page_url ? (
                                    <Link
                                        href={logs.prev_page_url}
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
                                    Page {logs.current_page} of {logs.last_page}
                                </span>
                                {logs.next_page_url ? (
                                    <Link
                                        href={logs.next_page_url}
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
            </div>
        </AppLayout>
    );
}
