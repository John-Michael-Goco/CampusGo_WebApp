import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableScroll,
    TableElement,
    tableHeadClass,
    tableCellClass,
    tableEmptyClass,
} from '@/components/ui/table';
import {
    REQUIREMENT_TYPE_OPTIONS
    
    
    
} from './types';
import type {Achievement, AchievementsFilters, QuestOption} from './types';

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

function requirementValueDisplay(achievement: Achievement, quests: QuestOption[]): string {
    if (achievement.requirement_type === 'complete_quest') {
        const q = quests.find((x) => x.id === achievement.requirement_value);
        return q ? q.title : 'Quest (deleted)';
    }
    return String(achievement.requirement_value);
}

const achievementsHeaderRowClass =
    'border-b border-rose-200/60 bg-gradient-to-r from-rose-50/90 to-rose-50/50 dark:border-rose-900/50 dark:from-rose-950/40 dark:to-rose-950/20 text-foreground';
const achievementsBodyRowClass =
    'border-b border-border/60 transition-colors hover:bg-rose-50/40 dark:hover:bg-rose-950/20 last:border-b-0';

type Props = {
    achievements: Achievement[];
    filters: AchievementsFilters;
    quests?: QuestOption[];
    onSort: (
        column: 'name' | 'requirement_type' | 'requirement_value'
    ) => void;
    onEdit: (achievement: Achievement) => void;
    onDelete: (achievement: Achievement) => void;
    canManage?: boolean;
};

export function AchievementsTable({
    achievements,
    filters,
    quests = [],
    onSort,
    onEdit,
    onDelete,
    canManage = true,
}: Props) {
    return (
        <Table className="border-rose-200/60 dark:border-rose-900/40 ring-1 ring-rose-200/20 dark:ring-rose-800/20">
            <TableScroll>
                <TableElement>
                    <thead>
                        <tr className={achievementsHeaderRowClass}>
                            <th className={tableHeadClass}>
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
                            <th className={tableHeadClass}>
                                Description
                            </th>
                            <th className={tableHeadClass}>
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
                            <th className={tableHeadClass}>
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
                            {canManage && (
                                <th className={`${tableHeadClass} text-right`}>
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {achievements.length === 0 ? (
                            <tr className={achievementsBodyRowClass}>
                                <td
                                    colSpan={canManage ? 5 : 4}
                                    className={tableEmptyClass}
                                >
                                    No achievements found.
                                </td>
                            </tr>
                        ) : (
                            achievements.map((achievement) => (
                                <tr
                                    key={achievement.id}
                                    className={achievementsBodyRowClass}
                                >
                                    <td className={`${tableCellClass} font-medium`}>
                                        {achievement.name}
                                    </td>
                                    <td className={`${tableCellClass} max-w-[280px] truncate text-muted-foreground`}>
                                        {achievement.description ?? '—'}
                                    </td>
                                    <td className={tableCellClass}>
                                        {requirementTypeLabel(
                                            achievement.requirement_type
                                        )}
                                    </td>
                                    <td className={tableCellClass}>
                                        {requirementValueDisplay(achievement, quests)}
                                    </td>
                                    {canManage && (
                                        <td className={`${tableCellClass} text-right`}>
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
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </TableElement>
            </TableScroll>
        </Table>
    );
}
