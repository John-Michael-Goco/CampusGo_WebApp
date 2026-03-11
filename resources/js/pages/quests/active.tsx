import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { sileo } from 'sileo';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { ActiveFilters } from './active/ActiveFilters';
import { ActiveTable } from './active/ActiveTable';
import { DeleteQuestDialog } from './active/DeleteQuestDialog';
import type { ActiveQuest, ActiveQuestsPageProps } from './active/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Quests', href: '/quests/active' },
    { title: 'Active', href: '/quests/active' },
];

export default function ActiveQuestsPage({
    quests,
    filters,
}: ActiveQuestsPageProps) {
    const pageProps = usePage().props as { auth?: { canManageQuests?: boolean; user?: { id: number } } };
    const canManageQuests = pageProps.auth?.canManageQuests ?? false;
    const currentUserId = pageProps.auth?.user?.id;
    const questItems = quests.data ?? [];
    const [search, setSearch] = useState(filters.search);
    const [deletingQuest, setDeletingQuest] = useState<ActiveQuest | null>(null);
    const isInitialMount = useRef(true);

    useEffect(() => {
        // Sync props to local state when filters change (e.g. from navigation)
         
        setSearch(filters.search);
    }, [filters.search]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        const t = setTimeout(() => {
            router.get(
                '/quests/active',
                {
                    search: search || undefined,
                    quest_type: filters.quest_type || undefined,
                    created_by_me: filters.created_by_me ? '1' : undefined,
                    sort_by: filters.sort_by,
                    sort_dir: filters.sort_dir,
                },
                { preserveState: true }
            );
        }, 300);
        return () => clearTimeout(t);
        // Intentionally only when search changes to avoid request loops
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const applyFilters = (overrides: Partial<typeof filters> = {}) => {
        const next = { ...filters, ...overrides };
        router.get(
            '/quests/active',
            {
                search: next.search || undefined,
                quest_type: next.quest_type || undefined,
                created_by_me: next.created_by_me ? '1' : undefined,
                sort_by: next.sort_by,
                sort_dir: next.sort_dir,
            },
            { preserveState: true }
        );
    };

    const getActiveReturnParams = () => ({
        from: 'active',
        active_search: search || undefined,
        active_quest_type: filters.quest_type || undefined,
        active_created_by_me: filters.created_by_me ? '1' : undefined,
        active_sort_by: filters.sort_by,
        active_sort_dir: filters.sort_dir,
    });

    const handleDeleteConfirm = () => {
        if (!deletingQuest) return;
        router.delete(`/quests/${deletingQuest.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingQuest(null);
                sileo.success({
                    title: 'Quest deleted',
                    description: 'The quest has been deleted.',
                });
            },
            onError: () => {
                sileo.error({
                    title: 'Error',
                    description: 'Failed to delete the quest.',
                });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Active Quests" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold">Active Quests</h1>

                <ActiveFilters
                    search={search}
                    onSearchChange={setSearch}
                    filters={filters}
                    onFiltersChange={applyFilters}
                />

                <ActiveTable
                    quests={questItems}
                    onView={(quest) => router.get(`/quests/${quest.id}`, getActiveReturnParams())}
                    onEdit={(quest) => router.get(`/quests/${quest.id}/edit`)}
                    onDelete={setDeletingQuest}
                    canManage={canManageQuests}
                    currentUserId={currentUserId}
                    activeReturnParams={getActiveReturnParams()}
                />

                {canManageQuests && (
                    <DeleteQuestDialog
                        quest={deletingQuest}
                        open={!!deletingQuest}
                        onOpenChange={(open) => !open && setDeletingQuest(null)}
                        onConfirm={handleDeleteConfirm}
                    />
                )}

                {quests.total > 0 && (
                    <div className="flex items-center justify-between gap-4 border-t pt-4">
                        <p className="text-sm text-muted-foreground">
                            Showing{' '}
                            {(quests.current_page - 1) * quests.per_page + 1} to{' '}
                            {Math.min(
                                quests.current_page * quests.per_page,
                                quests.total
                            )}{' '}
                            of {quests.total} entries
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
                                    Page {quests.current_page} of{' '}
                                    {quests.last_page}
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
