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
import { COURSE_OPTIONS, YEAR_LEVEL_OPTIONS } from './types';
import type { StudentsFilters } from './types';

type Props = {
    search: string;
    onSearchChange: (value: string) => void;
    filters: StudentsFilters;
    onFiltersChange: (updates: Partial<StudentsFilters>) => void;
    onOpenCreate: () => void;
};

export function StudentsFilters({
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
                    placeholder="Search by student number, first or last name..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                />
            </div>
            <Select
                value={filters.course || 'all'}
                onValueChange={(v) =>
                    onFiltersChange({ course: v === 'all' ? '' : v })
                }
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All courses</SelectItem>
                    {COURSE_OPTIONS.map((course) => (
                        <SelectItem key={course} value={course}>
                            {course}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select
                value={filters.year_level || 'all'}
                onValueChange={(v) =>
                    onFiltersChange({ year_level: v === 'all' ? '' : v })
                }
            >
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All year levels" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All year levels</SelectItem>
                    {YEAR_LEVEL_OPTIONS.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                            Year {y}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
