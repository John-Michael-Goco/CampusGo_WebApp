import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
    search: string;
    onSearchChange: (value: string) => void;
    onOpenCreate: () => void;
};

export function SemestersFilters({
    search,
    onSearchChange,
    onOpenCreate,
}: Props) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={onOpenCreate}>
                <Plus className="size-4" />
                Add semester
            </Button>
            <div className="relative min-w-[200px] flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by name..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                />
            </div>
        </div>
    );
}
