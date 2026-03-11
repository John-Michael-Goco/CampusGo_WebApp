import { parse, isValid } from 'date-fns';
import { Search, User, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import type { ActivityLogUser, LogsFilters as LogsFiltersType } from './types';

export type LogsFiltersProps = {
    filters: LogsFiltersType;
    search: string;
    onSearchChange: (value: string) => void;
    onFiltersChange: (updates: Partial<LogsFiltersType>) => void;
    activityLogUsers?: ActivityLogUser[];
};

function parseDate(value: string): Date | undefined {
    if (!value) return undefined;
    const d = parse(value, 'yyyy-MM-dd', new Date());
    return isValid(d) ? d : undefined;
}

export function LogsFilters({
    filters,
    search,
    onSearchChange,
    onFiltersChange,
    activityLogUsers = [],
}: LogsFiltersProps) {
    const hasDateFilter = Boolean(filters.date_from || filters.date_to);
    const [userSearch, setUserSearch] = useState('');
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    const filteredUsers = useMemo(() => {
        const term = userSearch.trim().toLowerCase();
        if (!term) return activityLogUsers;
        return activityLogUsers.filter((u) =>
            u.name.toLowerCase().includes(term)
        );
    }, [activityLogUsers, userSearch]);

    const selectedUserName =
        filters.user_id ?
            activityLogUsers.find((u) => String(u.id) === filters.user_id)?.name
        :   null;

    const handleSelectUser = (userId: string) => {
        onFiltersChange({ user_id: userId });
        setUserDropdownOpen(false);
        setUserSearch('');
    };

    const fromDateObj = parseDate(filters.date_from);

    return (
        <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by action or user..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                />
            </div>

            <DropdownMenu
                open={userDropdownOpen}
                onOpenChange={(open) => {
                    setUserDropdownOpen(open);
                    if (!open) setUserSearch('');
                }}
            >
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                        <User className="mr-2 size-4" />
                        {selectedUserName ?? 'Filter by user'}
                        {filters.user_id ? (
                            <span className="ml-2 size-2 rounded-full bg-primary" />
                        ) : null}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-0">
                    <div
                        className="border-b p-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Input
                            type="search"
                            placeholder="Search name..."
                            value={userSearch}
                            onChange={(e) =>
                                setUserSearch(e.target.value)}
                            className="h-8"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-[240px] overflow-y-auto py-1">
                        <DropdownMenuItem
                            onClick={() => handleSelectUser('')}
                        >
                            All users
                        </DropdownMenuItem>
                        {filteredUsers.length === 0 ? (
                            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                                No users match
                            </div>
                        ) : (
                            filteredUsers.map((user) => (
                                <DropdownMenuItem
                                    key={user.id}
                                    onClick={() =>
                                        handleSelectUser(String(user.id))}
                                >
                                    {user.name}
                                </DropdownMenuItem>
                            ))
                        )}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2">
                <div className="w-[180px]">
                    <DateTimePicker
                        value={filters.date_from}
                        onChange={(val) => onFiltersChange({ date_from: val })}
                        placeholder="From date"
                        showTime={false}
                        side="bottom"
                    />
                </div>
                <div className="w-[180px]">
                    <DateTimePicker
                        value={filters.date_to}
                        onChange={(val) => onFiltersChange({ date_to: val })}
                        placeholder="To date"
                        showTime={false}
                        side="bottom"
                        minDate={fromDateObj}
                    />
                </div>
                {hasDateFilter && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() =>
                            onFiltersChange({ date_from: '', date_to: '' })
                        }
                        aria-label="Clear dates"
                    >
                        <X className="size-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
