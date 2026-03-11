import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import type { CreatedQuest, PaginatedQuests } from './shared';
import {
    QuestSearchInput,
    QuestPagination,
    formatQuestDate,
    approvalStatusLabel,
    approvalStatusVariant,
} from './shared';

const createdQuestsHeaderRowClass =
    'border-b border-amber-200/60 bg-gradient-to-r from-amber-50/90 to-amber-50/50 dark:border-amber-900/50 dark:from-amber-950/40 dark:to-amber-950/20 text-foreground';
const createdQuestsBodyRowClass =
    'border-b border-border/60 transition-colors hover:bg-amber-50/40 dark:hover:bg-amber-950/20 last:border-b-0';

type Props = {
    quests: PaginatedQuests<CreatedQuest>;
    filters?: { search?: string };
};

function getBreadcrumbs(isAdmin: boolean): BreadcrumbItem[] {
    return [
        { title: 'Quests', href: '/quests/active' },
        { title: isAdmin ? 'Created Quests' : 'Approval', href: '/quests/created' },
    ];
}

export default function CreatedQuestsPage({ quests, filters = {} }: Props) {
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [cancelConfirmQuest, setCancelConfirmQuest] = useState<CreatedQuest | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const isInitialMount = useRef(true);
    const isAdmin = (usePage().props as { auth?: { isAdmin?: boolean } }).auth?.isAdmin ?? false;
    const items = quests.data ?? [];
    const pageTitle = isAdmin ? 'Created Quests' : 'Approval';

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        const t = setTimeout(() => {
            router.get('/quests/created', { search: search || undefined }, { preserveState: true });
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    const handleDelete = (quest: CreatedQuest) => {
        if (!isAdmin && quest.approval_status !== 'pending') return;
        setDeletingId(quest.id);
        router.delete(`/quests/${quest.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingId(null),
            onFinish: () => setDeletingId(null),
        });
    };

    const handleCancelConfirm = () => {
        if (!cancelConfirmQuest) return;
        router.delete(`/quests/${cancelConfirmQuest.id}`, {
            preserveScroll: true,
            onSuccess: () => setCancelConfirmQuest(null),
            onFinish: () => setCancelConfirmQuest(null),
        });
    };

    return (
        <AppLayout breadcrumbs={getBreadcrumbs(isAdmin)}>
            <Head title={pageTitle} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold">{pageTitle}</h1>

                <QuestSearchInput value={search} onChange={setSearch} />

                <Table className="border-amber-200/60 dark:border-amber-900/40 ring-1 ring-amber-200/20 dark:ring-amber-800/20">
                    <TableScroll>
                        <TableElement>
                            <thead>
                                <tr className={createdQuestsHeaderRowClass}>
                                    <th className={tableHeadClass}>Title</th>
                                    <th className={tableHeadClass}>Type</th>
                                    <th className={tableHeadClass}>Status</th>
                                    <th className={tableHeadClass}>Created</th>
                                    <th className={`${tableHeadClass} text-right`}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr className={createdQuestsBodyRowClass}>
                                        <td colSpan={5} className={tableEmptyClass}>
                                            You have not created any quests yet.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((quest) => (
                                        <tr
                                            key={quest.id}
                                            className={createdQuestsBodyRowClass}
                                        >
                                            <td className={`${tableCellClass} font-medium`}>{quest.title}</td>
                                            <td className={`${tableCellClass} capitalize`}>{quest.quest_type}</td>
                                            <td className={tableCellClass}>
                                                <Badge variant={approvalStatusVariant(quest.approval_status)}>
                                                    {approvalStatusLabel(quest.approval_status)}
                                                </Badge>
                                            </td>
                                            <td className={`${tableCellClass} text-muted-foreground`}>
                                                {formatQuestDate(quest.created_at)}
                                            </td>
                                            <td className={`${tableCellClass} text-right`}>
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        asChild
                                                    >
                                                        <Link href={`/quests/${quest.id}`} aria-label="View">
                                                            <Eye className="size-4" />
                                                        </Link>
                                                    </Button>
                                                    {isAdmin ? (
                                                        <>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8"
                                                                asChild
                                                            >
                                                                <Link href={`/quests/${quest.id}/edit`} aria-label="Edit">
                                                                    <Pencil className="size-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8 text-destructive hover:text-destructive"
                                                                disabled={deletingId === quest.id}
                                                                onClick={() => handleDelete(quest)}
                                                                aria-label="Delete"
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        quest.approval_status === 'pending' && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="destructive"
                                                                disabled={deletingId === quest.id}
                                                                onClick={() => setCancelConfirmQuest(quest)}
                                                            >
                                                                <Trash2 className="mr-1 size-4" />
                                                                Cancel
                                                            </Button>
                                                        )
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

                <Dialog open={!!cancelConfirmQuest} onOpenChange={(open) => !open && setCancelConfirmQuest(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Cancel quest</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to cancel <strong>{cancelConfirmQuest?.title}</strong>? This
                                will remove the quest and it will no longer be submitted for approval. This action
                                cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCancelConfirmQuest(null)}>
                                Keep
                            </Button>
                            <Button type="button" variant="destructive" onClick={handleCancelConfirm}>
                                Cancel quest
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {quests.total > 0 && (
                    <QuestPagination
                        pagination={{
                            total: quests.total,
                            current_page: quests.current_page,
                            per_page: quests.per_page,
                            last_page: quests.last_page,
                            prev_page_url: quests.prev_page_url ?? null,
                            next_page_url: quests.next_page_url ?? null,
                        }}
                    />
                )}
            </div>
        </AppLayout>
    );
}
