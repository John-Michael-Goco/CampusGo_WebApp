import { Head, Link, router, useForm } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { sileo } from 'sileo';
import AppLayout from '@/layouts/app-layout';
import type {
    MasterlistProfessorsProps,
    Professor,
} from './professors/types';
import { CreateProfessorDialog } from './professors/CreateProfessorDialog';
import { DeleteProfessorDialog } from './professors/DeleteProfessorDialog';
import { EditProfessorDialog } from './professors/EditProfessorDialog';
import { ProfessorsFilters } from './professors/ProfessorsFilters';
import { ProfessorsTable } from './professors/ProfessorsTable';

export default function MasterlistProfessors({
    professors,
    filters,
}: MasterlistProfessorsProps) {
    const professorItems = professors.data ?? [];
    const [search, setSearch] = useState(filters.search);
    const [createOpen, setCreateOpen] = useState(false);
    const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
    const [deletingProfessor, setDeletingProfessor] = useState<Professor | null>(null);
    const isInitialMount = useRef(true);

    const createForm = useForm({
        employee_id: '',
        title: '',
        first_name: '',
        last_name: '',
    });

    const editForm = useForm({
        employee_id: '',
        title: '',
        first_name: '',
        last_name: '',
    });

    const openEdit = (professor: Professor) => {
        setEditingProfessor(professor);
        editForm.setData({
            employee_id: professor.employee_id,
            title: professor.title,
            first_name: professor.first_name,
            last_name: professor.last_name,
        });
    };

    const filterQuery = () =>
        new URLSearchParams({
            search: search || '',
            title: filters.title || '',
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
        createForm.post(`/masterlist/professors?${filterQuery()}`, {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
                sileo.success({
                    title: 'Professor added',
                    description: 'The professor has been added to the masterlist.',
                    ...toastOptions.success,
                });
            },
            onError: () => {
                sileo.error({
                    title: 'Could not add professor',
                    description: 'Please check the form and try again.',
                    ...toastOptions.error,
                });
            },
        });
    };

    const handleEditSubmit = () => {
        if (!editingProfessor) return;
        editForm.put(`/masterlist/professors/${editingProfessor.id}?${filterQuery()}`, {
            preserveScroll: true,
            onSuccess: () => {
                sileo.success({
                    title: 'Professor updated',
                    description: 'The professor has been updated.',
                    ...toastOptions.success,
                });
            },
            onError: () => {
                sileo.error({
                    title: 'Could not update professor',
                    description: 'Please check the form and try again.',
                    ...toastOptions.error,
                });
            },
        });
    };

    const handleDeleteConfirm = () => {
        if (!deletingProfessor) return;
        router.delete(`/masterlist/professors/${deletingProfessor.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingProfessor(null);
                sileo.success({
                    title: 'Professor deleted',
                    description: 'The professor has been removed from the masterlist.',
                    ...toastOptions.success,
                });
            },
            onError: () => {
                sileo.error({
                    title: 'Could not delete professor',
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
            router.get('/masterlist/professors', {
                search: search || undefined,
                title: filters.title || undefined,
                sort_by: filters.sort_by,
                sort_dir: filters.sort_dir,
            }, { preserveState: true });
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    const updateFilters = useCallback(
        (updates: Partial<MasterlistProfessorsProps['filters']>) => {
            router.get('/masterlist/professors', {
                search: ('search' in updates ? updates.search : search) || undefined,
                title: ('title' in updates ? updates.title : filters.title) || undefined,
                sort_by: updates.sort_by ?? filters.sort_by,
                sort_dir: updates.sort_dir ?? filters.sort_dir,
            }, { preserveState: true });
        },
        [search, filters.title, filters.sort_by, filters.sort_dir]
    );

    const handleSort = (column: 'employee_id' | 'last_name') => {
        const nextDir =
            filters.sort_by === column && filters.sort_dir === 'asc'
                ? 'desc'
                : 'asc';
        updateFilters({ sort_by: column, sort_dir: nextDir });
    };

    return (
        <AppLayout>
            <Head title="Professors Masterlist" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold">Professors Masterlist</h1>

                <ProfessorsFilters
                    search={search}
                    onSearchChange={setSearch}
                    filters={filters}
                    onFiltersChange={updateFilters}
                    onOpenCreate={() => setCreateOpen(true)}
                />

                <ProfessorsTable
                    professors={professorItems}
                    filters={filters}
                    onSort={handleSort}
                    onEdit={openEdit}
                    onDelete={setDeletingProfessor}
                />

                {professors.total > 0 && (
                    <div className="flex items-center justify-between gap-4 border-t pt-4">
                        <p className="text-sm text-muted-foreground">
                            Showing {(professors.current_page - 1) * professors.per_page + 1} to{' '}
                            {Math.min(professors.current_page * professors.per_page, professors.total)} of{' '}
                            {professors.total} entries
                        </p>
                        {professors.last_page > 1 && (
                            <div className="flex items-center gap-2">
                                {professors.prev_page_url ? (
                                    <Link
                                        href={professors.prev_page_url}
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
                                    Page {professors.current_page} of {professors.last_page}
                                </span>
                                {professors.next_page_url ? (
                                    <Link
                                        href={professors.next_page_url}
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

                <CreateProfessorDialog
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    form={createForm}
                    onSubmit={handleCreateSubmit}
                />

                <EditProfessorDialog
                    open={!!editingProfessor}
                    onOpenChange={(open) => !open && setEditingProfessor(null)}
                    form={editForm}
                    onSubmit={handleEditSubmit}
                />

                <DeleteProfessorDialog
                    professor={deletingProfessor}
                    open={!!deletingProfessor}
                    onOpenChange={(open) => !open && setDeletingProfessor(null)}
                    onConfirm={handleDeleteConfirm}
                />
            </div>
        </AppLayout>
    );
}
