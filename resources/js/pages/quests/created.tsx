import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Pencil, Search, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type CreatedQuest = {
    id: number;
    title: string;
    quest_type: string;
    approval_status: string;
    created_at: string;
};

type PaginatedQuests = {
    data: CreatedQuest[];
    total: number;
    current_page: number;
    per_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

type Props = {
    quests: PaginatedQuests;
    filters?: { search?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Quests', href: '/quests/active' },
    { title: 'Created Quests', href: '/quests/created' },
];

function statusLabel(status: string): string {
    if (status === 'approved') return 'Approved';
    if (status === 'rejected') return 'Rejected';
    return 'Pending';
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (status === 'approved') return 'default';
    if (status === 'rejected') return 'destructive';
    return 'secondary';
}

export default function CreatedQuestsPage({ quests, filters = {} }: Props) {
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const isInitialMount = useRef(true);
    const isAdmin = (usePage().props as { auth?: { isAdmin?: boolean } }).auth?.isAdmin ?? false;
    const items = quests.data ?? [];

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Created Quests" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold">Created Quests</h1>

                <div className="relative flex w-full">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by title or description..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9"
                    />
                </div>

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
                                                <Badge variant={statusVariant(quest.approval_status)}>
                                                    {statusLabel(quest.approval_status)}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {quest.created_at
                                                    ? new Date(quest.created_at).toLocaleDateString(undefined, {
                                                          year: 'numeric',
                                                          month: 'short',
                                                          day: 'numeric',
                                                      })
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {isAdmin ? (
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8"
                                                            asChild
                                                        >
                                                            <Link href={`/quests/${quest.id}/edit`} aria-label="View / Edit">
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
                                                    </div>
                                                ) : (
                                                    quest.approval_status === 'pending' && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="destructive"
                                                            disabled={deletingId === quest.id}
                                                            onClick={() => handleDelete(quest)}
                                                        >
                                                            <Trash2 className="mr-1 size-4" />
                                                            {deletingId === quest.id ? 'Deleting…' : 'Cancel / Delete'}
                                                        </Button>
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {quests.total > 0 && (
                    <div className="flex items-center justify-between gap-4 border-t pt-4">
                        <p className="text-sm text-muted-foreground">
                            Showing {(quests.current_page - 1) * quests.per_page + 1} to{' '}
                            {Math.min(quests.current_page * quests.per_page, quests.total)} of {quests.total} entries
                        </p>
                        {quests.last_page > 1 && (
                            <div className="flex items-center gap-2">
                                {quests.prev_page_url ? (
                                    <Link
                                        href={quests.prev_page_url}
                                        preserveState
                                        className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                                    >
                                        <ArrowLeft className="size-4" />
                                        Previous
                                    </Link>
                                ) : (
                                    <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-transparent bg-muted/50 px-3 py-2 text-sm font-medium text-muted-foreground">
                                        <ArrowLeft className="size-4" />
                                        Previous
                                    </span>
                                )}
                                <span className="text-sm text-muted-foreground">
                                    Page {quests.current_page} of {quests.last_page}
                                </span>
                                {quests.next_page_url ? (
                                    <Link
                                        href={quests.next_page_url}
                                        preserveState
                                        className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                                    >
                                        Next
                                        <ArrowRight className="size-4" />
                                    </Link>
                                ) : (
                                    <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-transparent bg-muted/50 px-3 py-2 text-sm font-medium text-muted-foreground">
                                        Next
                                        <ArrowRight className="size-4" />
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
