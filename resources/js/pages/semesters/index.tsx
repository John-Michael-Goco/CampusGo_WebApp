import { Head, Link, router, useForm } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { sileo } from 'sileo';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Semester, SemestersPageProps } from './types';
import { SemestersFilters } from './SemestersFilters';
import { SemestersTable } from './SemestersTable';
import { CreateSemesterDialog } from './CreateSemesterDialog';
import { EditSemesterDialog } from './EditSemesterDialog';
import { DeleteSemesterDialog } from './DeleteSemesterDialog';
import type { SemesterFormData } from './SemesterFormFields';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Academic management', href: '/masterlist/students' },
    { title: 'Semester', href: '/semesters' },
];

function toDateInputValue(dateStr: string | null): string {
    if (!dateStr) return '';
    try {
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
                />

                <SemestersTable
                    semesters={items}
                    filters={filters}
                    onSort={handleSort}
                    onEdit={openEdit}
                    onDelete={setDeletingSemester}
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
            </div>
        </AppLayout>
    );
}
