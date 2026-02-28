import { Head, router, useForm } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
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

    const handleCreateSubmit = () => {
        createForm.post('/masterlist/professors', {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEditSubmit = () => {
        if (!editingProfessor) return;
        editForm.put(`/masterlist/professors/${editingProfessor.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingProfessor(null);
                editForm.reset();
            },
        });
    };

    const handleDeleteConfirm = () => {
        if (!deletingProfessor) return;
        router.delete(`/masterlist/professors/${deletingProfessor.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingProfessor(null),
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
                    professors={professors}
                    filters={filters}
                    onSort={handleSort}
                    onEdit={openEdit}
                    onDelete={setDeletingProfessor}
                />

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
