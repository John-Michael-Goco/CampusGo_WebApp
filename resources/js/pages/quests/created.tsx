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
import type { CreatedQuest, PaginatedQuests } from './shared';
import {
    QuestSearchInput,
    QuestPagination,
    formatQuestDate,
    approvalStatusLabel,
    approvalStatusVariant,
} from './shared';

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

                <div className="overflow-hidden rounded-lg border bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="h-11 px-4 text-left font-medium">Title</th>
                                    <th className="h-11 px-4 text-left font-medium">Type</th>
                                    <th className="h-11 px-4 text-left font-medium">Status</th>
                                    <th className="h-11 px-4 text-left font-medium">Created</th>
                                    <th className="h-11 px-4 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="h-24 px-4 text-center text-muted-foreground">
                                            You have not created any quests yet.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((quest) => (
                                        <tr
                                            key={quest.id}
                                            className="border-b transition-colors hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3 font-medium">{quest.title}</td>
                                            <td className="px-4 py-3 capitalize">{quest.quest_type}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant={approvalStatusVariant(quest.approval_status)}>
                                                    {approvalStatusLabel(quest.approval_status)}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {formatQuestDate(quest.created_at)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
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
                        </table>
                    </div>
                </div>

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
