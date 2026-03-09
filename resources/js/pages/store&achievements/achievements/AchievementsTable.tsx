import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    REQUIREMENT_TYPE_OPTIONS,
    type Achievement,
    type AchievementsFilters,
} from './types';

function SortIcon({
    column,
    currentSort,
    sortDir,
}: {
    column: string;
    currentSort: string;
    sortDir: string;
}) {
    if (currentSort !== column) {
        return <ArrowUpDown className="ml-1 size-4 opacity-50" />;
    }
    return sortDir === 'asc' ? (
        <ArrowUp className="ml-1 size-4" />
    ) : (
        <ArrowDown className="ml-1 size-4" />
    );
}

function requirementTypeLabel(value: string): string {
    const opt = REQUIREMENT_TYPE_OPTIONS.find((o) => o.value === value);
    return opt?.label ?? value;
}

type Props = {
    achievements: Achievement[];
    filters: AchievementsFilters;
    onSort: (
        column: 'name' | 'requirement_type' | 'requirement_value'
    ) => void;
    onEdit: (achievement: Achievement) => void;
    onDelete: (achievement: Achievement) => void;
};

export function AchievementsTable({
    achievements,
    filters,
    onSort,
    onEdit,
    onDelete,
}: Props) {
    return (
        <div className="rounded-lg border bg-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="h-11 px-4 text-left font-medium">
                                <button
                                    type="button"
                                    className="inline-flex items-center hover:underline"
                                    onClick={() => onSort('name')}
                                >
                                    Name
                                    <SortIcon
                                        column="name"
                                        currentSort={filters.sort_by}
                                        sortDir={filters.sort_dir}
                                    />
                                </button>
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                Description
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                <button
                                    type="button"
                                    className="inline-flex items-center hover:underline"
                                    onClick={() => onSort('requirement_type')}
                                >
                                    Requirement type
                                    <SortIcon
                                        column="requirement_type"
                                        currentSort={filters.sort_by}
                                        sortDir={filters.sort_dir}
                                    />
                                </button>
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                <button
                                    type="button"
                                    className="inline-flex items-center hover:underline"
                                    onClick={() => onSort('requirement_value')}
                                >
                                    Requirement value
                                    <SortIcon
                                        column="requirement_value"
                                        currentSort={filters.sort_by}
                                        sortDir={filters.sort_dir}
                                    />
                                </button>
                            </th>
                            <th className="h-11 px-4 text-right font-medium">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {achievements.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="h-24 px-4 text-center text-muted-foreground"
                                >
                                    No achievements found.
                                </td>
                            </tr>
                        ) : (
                            achievements.map((achievement) => (
                                <tr
                                    key={achievement.id}
                                    className="border-b transition-colors hover:bg-muted/30"
                                >
                                    <td className="px-4 py-3 font-medium">
                                        {achievement.name}
                                    </td>
                                    <td className="max-w-[280px] truncate px-4 py-3 text-muted-foreground">
                                        {achievement.description ?? '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {requirementTypeLabel(
                                            achievement.requirement_type
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {achievement.requirement_value}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                onClick={() =>
                                                    onEdit(achievement)
                                                }
                                                aria-label="Edit"
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-destructive hover:text-destructive"
                                                onClick={() =>
                                                    onDelete(achievement)
                                                }
                                                aria-label="Delete"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
