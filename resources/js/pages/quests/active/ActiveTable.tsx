import { Link } from '@inertiajs/react';
import { Eye, Pencil, Printer, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableScroll,
    TableElement,
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

const questsHeaderRowClass =
    'border-b border-emerald-200/60 bg-gradient-to-r from-emerald-50/90 to-emerald-50/50 dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-emerald-950/20 text-foreground';
const questsBodyRowClass =
    'border-b border-border/60 transition-colors hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 last:border-b-0';

type Props = {
    quests: ActiveQuest[];
    onView: (quest: ActiveQuest) => void;
    onEdit: (quest: ActiveQuest) => void;
    onDelete: (quest: ActiveQuest) => void;
    canManage?: boolean;
    /** When set (e.g. professor), show Print QR only for quests created by this user. */
    currentUserId?: number | null;
    /** Params to preserve when linking to show/print-qr so Back returns to same filters. */
    activeReturnParams?: Record<string, string | undefined>;
};

function activeReturnQuery(params?: Record<string, string | undefined>): string {
    if (!params) return 'from=active';
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v != null && v !== '') qs.set(k, v);
    });
    return qs.toString() || 'from=active';
}

export function ActiveTable({ quests, onView, onEdit, onDelete, canManage = true, currentUserId, activeReturnParams }: Props) {
    return (
        <Table className="border-emerald-200/60 dark:border-emerald-900/40 ring-1 ring-emerald-200/20 dark:ring-emerald-800/20">
            <TableScroll>
                <TableElement>
                    <thead>
                        <tr className={questsHeaderRowClass}>
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
                            <tr className={questsBodyRowClass}>
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
                                    className={questsBodyRowClass}
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
                                            {canManage ? (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        asChild
                                                    >
                                                        <Link href={`/quests/${quest.id}/print-qr?${activeReturnQuery(activeReturnParams)}`} aria-label="Print QR codes">
                                                            <Printer className="size-4" />
                                                        </Link>
                                                    </Button>
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
                                            ) : (
                                                <>
                                                    {currentUserId != null && quest.creator?.id === currentUserId && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8"
                                                            asChild
                                                        >
                                                            <Link href={`/quests/${quest.id}/print-qr?${activeReturnQuery(activeReturnParams)}`} aria-label="Print QR codes">
                                                                <Printer className="size-4" />
                                                            </Link>
                                                        </Button>
                                                    )}
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
