import { Link } from '@inertiajs/react';
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
import type { ActiveQuestsFilters as FiltersType, QuestType } from './types';

type Props = {
    search: string;
    onSearchChange: (value: string) => void;
    filters: FiltersType;
    onFiltersChange: (updates: Partial<FiltersType>) => void;
};

export function ActiveFilters({
    search,
    onSearchChange,
    filters,
    onFiltersChange,
}: Props) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <Button type="button" asChild>
                <Link href="/quests/create">
                    <Plus className="mr-2 size-4" />
                    Create quest
                </Link>
            </Button>
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by title or description..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                />
            </div>
            <Select
                value={filters.quest_type || 'all'}
                onValueChange={(value) =>
                    onFiltersChange({
                        quest_type:
                            value === 'all' ? '' : (value as QuestType),
                    })
                }
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All quest types" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All quest types</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="enrollment">Enrollment</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
