import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableScroll,
    TableElement,
    tableHeaderRowClass,
    tableBodyRowClass,
    tableHeadClass,
    tableCellClass,
    tableEmptyClass,
} from '@/components/ui/table';
import type { ActiveQuest, QuestStatus } from './types';

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    try {
        const datePart = dateStr.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        return d.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return '—';
    }
}

const STATUS_VARIANT: Record<QuestStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    ongoing: 'default',
    upcoming: 'secondary',
    completed: 'outline',
    cancelled: 'destructive',
};

type Props = {
    quests: ActiveQuest[];
    onView: (quest: ActiveQuest) => void;
    onEdit: (quest: ActiveQuest) => void;
    onDelete: (quest: ActiveQuest) => void;
    canManage?: boolean;
};

export function ActiveTable({ quests, onView, onEdit, onDelete, canManage = true }: Props) {
    return (
        <Table>
            <TableScroll>
                <TableElement>
                    <thead>
                        <tr className={tableHeaderRowClass}>
                            <th className={tableHeadClass}>
                                Title
                            </th>
                            <th className={tableHeadClass}>
                                Type
                            </th>
                            <th className={tableHeadClass}>
                                Status
                            </th>
                            <th className={tableHeadClass}>
                                Start date
                            </th>
                            <th className={tableHeadClass}>
                                End date
                            </th>
                            <th className={tableHeadClass}>
                                Created by
                            </th>
                            <th className={tableHeadClass}>
                                Reward (pts)
                            </th>
                            <th className={tableHeadClass}>
                                Participants
                            </th>
                            <th className={`${tableHeadClass} text-right`}>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {quests.length === 0 ? (
                            <tr className={tableBodyRowClass}>
                                <td
                                    colSpan={9}
                                    className={tableEmptyClass}
                                >
                                    No active quests found.
                                </td>
                            </tr>
                        ) : (
                            quests.map((quest) => (
                                <tr
                                    key={quest.id}
                                    className={tableBodyRowClass}
                                >
                                    <td className={`${tableCellClass} font-medium`}>
                                        {quest.title}
                                    </td>
                                    <td className={`${tableCellClass} capitalize`}>
                                        {quest.quest_type}
                                    </td>
                                    <td className={tableCellClass}>
                                        <Badge variant={STATUS_VARIANT[quest.status]} className="capitalize">
                                            {quest.status}
                                        </Badge>
                                    </td>
                                    <td className={`${tableCellClass} text-muted-foreground`}>
                                        {formatDate(quest.start_date)}
                                    </td>
                                    <td className={`${tableCellClass} text-muted-foreground`}>
                                        {formatDate(quest.end_date)}
                                    </td>
                                    <td className={`${tableCellClass} text-muted-foreground`}>
                                        {quest.creator?.name ?? '—'}
                                    </td>
                                    <td className={tableCellClass}>
                                        {quest.reward_points}
                                    </td>
                                    <td className={tableCellClass}>
                                        {quest.max_participants != null && quest.max_participants > 0
                                            ? `${quest.current_participants} / ${quest.max_participants}`
                                            : `${quest.current_participants} / Unlimited`}
                                    </td>
                                    <td className={`${tableCellClass} text-right`}>
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                onClick={() => onView(quest)}
                                                aria-label="View"
                                            >
                                                <Eye className="size-4" />
                                            </Button>
                                            {canManage && (
                                                <>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        onClick={() => onEdit(quest)}
                                                        aria-label="Edit"
                                                    >
                                                        <Pencil className="size-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-destructive hover:text-destructive"
                                                        onClick={() => onDelete(quest)}
                                                        aria-label="Delete"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </TableElement>
            </TableScroll>
        </Table>
    );
}
