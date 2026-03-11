import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { sileo } from 'sileo';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { AchievementFormData } from './achievements/AchievementFormFields';
import { AchievementsFilters } from './achievements/AchievementsFilters';
import { AchievementsTable } from './achievements/AchievementsTable';
import { CreateAchievementDialog } from './achievements/CreateAchievementDialog';
import { DeleteAchievementDialog } from './achievements/DeleteAchievementDialog';
import { EditAchievementDialog } from './achievements/EditAchievementDialog';
import type {
    Achievement,
    AchievementsPageProps,
} from './achievements/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Store & Achievements', href: '/store' },
    { title: 'Achievements', href: '/achievements' },
];

export default function AchievementsPage({
    achievements,
    quests = [],
    filters,
}: AchievementsPageProps) {
    const canManageAchievements = (usePage().props as { auth?: { canManageAchievements?: boolean } }).auth?.canManageAchievements ?? false;
    const achievementItems = achievements.data ?? [];
    const [search, setSearch] = useState(filters.search);
    const [createOpen, setCreateOpen] = useState(false);
    const [editingAchievement, setEditingAchievement] =
        useState<Achievement | null>(null);
    const [deletingAchievement, setDeletingAchievement] =
        useState<Achievement | null>(null);
    const isInitialMount = useRef(true);

    const createForm = useForm<AchievementFormData>({
        name: '',
        description: '',
        requirement_type: 'quest_count',
        requirement_value: '',
    });

    const editForm = useForm<AchievementFormData>({
        name: '',
        description: '',
        requirement_type: 'quest_count',
        requirement_value: '',
    });

    const openEdit = (achievement: Achievement) => {
        setEditingAchievement(achievement);
        editForm.setData({
            name: achievement.name,
            description: achievement.description ?? '',
            requirement_type: achievement.requirement_type,
            requirement_value: achievement.requirement_value,
        });
    };

    const filterQuery = () =>
        new URLSearchParams({
            search: search || '',
            sort_by: filters.sort_by,
            sort_dir: filters.sort_dir,
        }).toString();

    const toastOptions = {
        success: {
            fill: '#166534',
            styles: {
                title: 'text-white!',
                description: 'text-white/90!',
                badge: 'hidden',
            },
        },
        error: {
            fill: '#991b1b',
            styles: {
                title: 'text-white!',
                description: 'text-white/90!',
                badge: 'hidden',
            },
        },
    } as const;

    const handleCreateSubmit = () => {
        createForm.post(`/achievements?${filterQuery()}`, {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
                sileo.success({
                    title: 'Achievement added',
                    description: 'The achievement has been created.',
                    ...toastOptions.success,
                });
            },
            onError: () => {
                sileo.error({
                    title: 'Could not add achievement',
                    description: 'Please check the form and try again.',
                    ...toastOptions.error,
                });
            },
        });
    };

    const handleEditSubmit = () => {
        if (!editingAchievement) return;
        editForm.put(
            `/achievements/${editingAchievement.id}?${filterQuery()}`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    sileo.success({
                        title: 'Achievement updated',
                        description: 'The achievement has been updated.',
                        ...toastOptions.success,
                    });
                },
                onError: () => {
                    sileo.error({
                        title: 'Could not update achievement',
                        description: 'Please check the form and try again.',
                        ...toastOptions.error,
                    });
                },
            }
        );
    };

    const handleDeleteConfirm = () => {
        if (!deletingAchievement) return;
        router.delete(
            `/achievements/${deletingAchievement.id}?${filterQuery()}`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setDeletingAchievement(null);
                    sileo.success({
                        title: 'Achievement deleted',
                        description: 'The achievement has been removed.',
                        ...toastOptions.success,
                    });
                },
                onError: () => {
                    sileo.error({
                        title: 'Could not delete achievement',
                        description: 'Something went wrong. Please try again.',
                        ...toastOptions.error,
                    });
                },
            }
        );
    };

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
            router.get('/achievements', {
                search: search || undefined,
                sort_by: filters.sort_by,
                sort_dir: filters.sort_dir,
            }, { preserveState: true });
        }, 300);
        return () => clearTimeout(t);
        // Intentionally only when search changes to avoid request loops
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const updateFilters = useCallback(
        (updates: Partial<AchievementsPageProps['filters']>) => {
            router.get('/achievements', {
                search: ('search' in updates ? updates.search : search) || undefined,
                sort_by: updates.sort_by ?? filters.sort_by,
                sort_dir: updates.sort_dir ?? filters.sort_dir,
            }, { preserveState: true });
        },
        [search, filters.sort_by, filters.sort_dir]
    );

    const handleSort = (
        column: 'name' | 'requirement_type' | 'requirement_value'
    ) => {
        const nextDir =
            filters.sort_by === column && filters.sort_dir === 'asc'
                ? 'desc'
                : 'asc';
        updateFilters({ sort_by: column, sort_dir: nextDir });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Achievements" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold">Achievements</h1>

                <AchievementsFilters
                    search={search}
                    onSearchChange={setSearch}
                    onOpenCreate={() => setCreateOpen(true)}
                    canManage={canManageAchievements}
                />

                <AchievementsTable
                    achievements={achievementItems}
                    filters={filters}
                    quests={quests}
                    onSort={handleSort}
                    onEdit={openEdit}
                    onDelete={setDeletingAchievement}
                    canManage={canManageAchievements}
                />

                {achievements.total > 0 && (
                    <div className="flex items-center justify-between gap-4 border-t pt-4">
                        <p className="text-sm text-muted-foreground">
                            Showing{' '}
                            {(achievements.current_page - 1) *
                                achievements.per_page +
                                1}{' '}
                            to{' '}
                            {Math.min(
                                achievements.current_page *
                                    achievements.per_page,
                                achievements.total
                            )}{' '}
                            of {achievements.total} entries
                        </p>
                        {achievements.last_page > 1 && (
                            <div className="flex items-center gap-2">
                                {achievements.prev_page_url ? (
                                    <Link
                                        href={achievements.prev_page_url}
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
                                    Page {achievements.current_page} of{' '}
                                    {achievements.last_page}
                                </span>
                                {achievements.next_page_url ? (
                                    <Link
                                        href={achievements.next_page_url}
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

                {canManageAchievements && (
                    <>
                        <CreateAchievementDialog
                            open={createOpen}
                            onOpenChange={setCreateOpen}
                            form={createForm}
                            onSubmit={handleCreateSubmit}
                            quests={quests}
                        />
                        <EditAchievementDialog
                            open={!!editingAchievement}
                            onOpenChange={(open) =>
                                !open && setEditingAchievement(null)
                            }
                            form={editForm}
                            onSubmit={handleEditSubmit}
                            quests={quests}
                        />
                        <DeleteAchievementDialog
                            achievement={deletingAchievement}
                            open={!!deletingAchievement}
                            onOpenChange={(open) =>
                                !open && setDeletingAchievement(null)
                            }
                            onConfirm={handleDeleteConfirm}
                        />
                    </>
                )}
            </div>
        </AppLayout>
    );
}
