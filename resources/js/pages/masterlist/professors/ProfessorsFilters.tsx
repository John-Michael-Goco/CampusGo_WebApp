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
import { TITLE_OPTIONS } from './types';
import type { ProfessorsFilters } from './types';

type Props = {
    search: string;
    onSearchChange: (value: string) => void;
    filters: ProfessorsFilters;
    onFiltersChange: (updates: Partial<ProfessorsFilters>) => void;
    onOpenCreate: () => void;
};

export function ProfessorsFilters({
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
                Create
            </Button>
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by employee ID, first or last name..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                />
            </div>
            <Select
                value={filters.title || 'all'}
                onValueChange={(v) =>
                    onFiltersChange({ title: v === 'all' ? '' : v })
                }
            >
                <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All titles" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All titles</SelectItem>
                    {TITLE_OPTIONS.map((title) => (
                        <SelectItem key={title} value={title}>
                            {title}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
