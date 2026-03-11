import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { sileo } from 'sileo';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { CreateSemesterDialog } from './CreateSemesterDialog';
import { DeleteSemesterDialog } from './DeleteSemesterDialog';
import { EditSemesterDialog } from './EditSemesterDialog';
import type { SemesterFormData } from './SemesterFormFields';
import { SemestersFilters } from './SemestersFilters';
import { SemestersTable } from './SemestersTable';
import type { Semester, SemestersPageProps } from './types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Academic management', href: '/masterlist/students' },
    { title: 'Semester', href: '/semesters' },
];

function toDateInputValue(dateStr: string | null): string {
    if (!dateStr) return '';
    try {
        const datePart = dateStr.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
        const d = new Date(dateStr);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    } catch {
        return '';
    }
}

export default function SemestersPage({
    semesters,
    filters,
}: SemestersPageProps) {
    const canManageSemesters = (usePage().props as { auth?: { canManageSemesters?: boolean } }).auth?.canManageSemesters ?? false;
    const items = semesters.data ?? [];
    const [search, setSearch] = useState(filters.search);
    const [createOpen, setCreateOpen] = useState(false);
    const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
    const [deletingSemester, setDeletingSemester] = useState<Semester | null>(null);
    const isInitialMount = useRef(true);

    const createForm = useForm<SemesterFormData>({
        name: '',
        start_date: '',
        end_date: '',
    });

    const editForm = useForm<SemesterFormData>({
        name: '',
        start_date: '',
        end_date: '',
    });

    const openEdit = (semester: Semester) => {
        setEditingSemester(semester);
        editForm.setData({
            name: semester.name,
            start_date: toDateInputValue(semester.start_date) || '',
            end_date: toDateInputValue(semester.end_date) || '',
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
        createForm.post(`/semesters?${filterQuery()}`, {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
                sileo.success({
                    title: 'Semester added',
                    description: 'The semester has been created.',
                    ...toastOptions.success,
                });
            },
            onError: () => {
                sileo.error({
                    title: 'Could not add semester',
                    description: 'Please check the form and try again.',
                    ...toastOptions.error,
                });
            },
        });
    };

    const handleEditSubmit = () => {
        if (!editingSemester) return;
        editForm.put(`/semesters/${editingSemester.id}?${filterQuery()}`, {
            preserveScroll: true,
            onSuccess: () => {
                sileo.success({
                    title: 'Semester updated',
                    description: 'The semester has been updated.',
                    ...toastOptions.success,
                });
            },
            onError: () => {
                sileo.error({
                    title: 'Could not update semester',
                    description: 'Please check the form and try again.',
                    ...toastOptions.error,
                });
            },
        });
    };

    const handleDeleteConfirm = () => {
        if (!deletingSemester) return;
        router.delete(`/semesters/${deletingSemester.id}?${filterQuery()}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingSemester(null);
                sileo.success({
                    title: 'Semester deleted',
                    description: 'The semester has been removed.',
                    ...toastOptions.success,
                });
            },
            onError: () => {
                sileo.error({
                    title: 'Could not delete semester',
                    description: 'Something went wrong. Please try again.',
                    ...toastOptions.error,
                });
            },
        });
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
            router.get(
                '/semesters',
                {
                    search: search || undefined,
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

    const updateFilters = useCallback(
        (updates: Partial<SemestersPageProps['filters']>) => {
            router.get(
                '/semesters',
                {
                    search:
                        'search' in updates ? updates.search : search || undefined,
                    sort_by: updates.sort_by ?? filters.sort_by,
                    sort_dir: updates.sort_dir ?? filters.sort_dir,
                },
                { preserveState: true }
            );
        },
        [search, filters.sort_by, filters.sort_dir]
    );

    const handleSort = (
        column: 'name' | 'start_date' | 'end_date'
    ) => {
        const nextDir =
            filters.sort_by === column && filters.sort_dir === 'asc'
                ? 'desc'
                : 'asc';
        updateFilters({ sort_by: column, sort_dir: nextDir });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Semesters" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold">Semesters</h1>

                <SemestersFilters
                    search={search}
                    onSearchChange={setSearch}
                    onOpenCreate={() => setCreateOpen(true)}
                    canManage={canManageSemesters}
                />

                <SemestersTable
                    semesters={items}
                    filters={filters}
                    onSort={handleSort}
                    onEdit={openEdit}
                    onDelete={setDeletingSemester}
                    canManage={canManageSemesters}
                />

                {semesters.total > 0 && (
                    <div className="flex items-center justify-between gap-4 border-t pt-4">
                        <p className="text-sm text-muted-foreground">
                            Showing{' '}
                            {(semesters.current_page - 1) * semesters.per_page +
                                1}{' '}
                            to{' '}
                            {Math.min(
                                semesters.current_page * semesters.per_page,
                                semesters.total
                            )}{' '}
                            of {semesters.total} entries
                        </p>
                        {semesters.last_page > 1 && (
                            <div className="flex items-center gap-2">
                                {semesters.prev_page_url ? (
                                    <Link
                                        href={semesters.prev_page_url}
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
                                    Page {semesters.current_page} of{' '}
                                    {semesters.last_page}
                                </span>
                                {semesters.next_page_url ? (
                                    <Link
                                        href={semesters.next_page_url}
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

                {canManageSemesters && (
                    <>
                        <CreateSemesterDialog
                            open={createOpen}
                            onOpenChange={setCreateOpen}
                            form={createForm}
                            onSubmit={handleCreateSubmit}
                        />
                        <EditSemesterDialog
                            open={!!editingSemester}
                            onOpenChange={(open) => !open && setEditingSemester(null)}
                            form={editForm}
                            onSubmit={handleEditSubmit}
                        />
                        <DeleteSemesterDialog
                            semester={deletingSemester}
                            open={!!deletingSemester}
                            onOpenChange={(open) => !open && setDeletingSemester(null)}
                            onConfirm={handleDeleteConfirm}
                        />
                    </>
                )}
            </div>
        </AppLayout>
    );
}
