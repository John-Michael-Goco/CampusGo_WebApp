import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ROLE_OPTIONS } from './types';
import type { UsersFilters as UsersFiltersType } from './types';

type Props = {
    search: string;
    onSearchChange: (value: string) => void;
    filters: UsersFiltersType;
    onFiltersChange: (updates: Partial<UsersFiltersType>) => void;
    onOpenCreate: () => void;
};

export function UsersFilters({
    search,
    onSearchChange,
    filters,
    onFiltersChange,
    onOpenCreate,
}: Props) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={onOpenCreate}>
                <Plus className="size-4" />
                Add gamemaster
            </Button>
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                />
            </div>
            <Select
                value={filters.role || 'all'}
                onValueChange={(v) =>
                    onFiltersChange({ role: v === 'all' ? '' : v })
                }
            >
                <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    {ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role} value={role}>
                            <span className="capitalize">{role}</span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
