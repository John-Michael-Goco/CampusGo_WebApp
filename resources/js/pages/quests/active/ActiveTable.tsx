import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
};

export function ActiveTable({ quests, onView, onEdit, onDelete }: Props) {
    return (
        <div className="overflow-hidden rounded-lg border bg-card">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="h-11 px-4 text-left font-medium">
                                Title
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                Type
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                Status
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                Start date
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                End date
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                Buy-in (pts)
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                Reward (pts)
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                Participants
                            </th>
                            <th className="h-11 px-4 text-right font-medium">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {quests.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="h-24 px-4 text-center text-muted-foreground"
                                >
                                    No active quests found.
                                </td>
                            </tr>
                        ) : (
                            quests.map((quest) => (
                                <tr
                                    key={quest.id}
                                    className="border-b transition-colors hover:bg-muted/30"
                                >
                                    <td className="px-4 py-3 font-medium">
                                        {quest.title}
                                    </td>
                                    <td className="px-4 py-3 capitalize">
                                        {quest.quest_type}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={STATUS_VARIANT[quest.status]} className="capitalize">
                                            {quest.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {formatDate(quest.start_date)}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {formatDate(quest.end_date)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {quest.buy_in_points}
                                    </td>
                                    <td className="px-4 py-3">
                                        {quest.reward_points}
                                    </td>
                                    <td className="px-4 py-3">
                                        {quest.current_participants}
                                        {quest.max_participants
                                            ? ` / ${quest.max_participants}`
                                            : ''}
                                    </td>
                                    <td className="px-4 py-3 text-right">
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
