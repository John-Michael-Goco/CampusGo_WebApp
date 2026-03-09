import { Calendar, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { LogsFilters as LogsFiltersType } from './types';

type Props = {
    filters: LogsFiltersType;
    search: string;
    onSearchChange: (value: string) => void;
    onFiltersChange: (updates: Partial<LogsFiltersType>) => void;
};

export function LogsFilters({
    filters,
    search,
    onSearchChange,
    onFiltersChange,
}: Props) {
    const hasDateFilter = Boolean(filters.date_from || filters.date_to);

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
                                    onFiltersChange({ date_from: e.target.value })
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
                                    onFiltersChange({ date_to: e.target.value })
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
                                    onFiltersChange({
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
    );
}
