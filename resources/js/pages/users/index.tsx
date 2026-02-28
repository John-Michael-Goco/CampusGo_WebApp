import { Head, router, useForm } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { UsersIndexProps } from './types';
import { CreateGamemasterDialog } from './CreateGamemasterDialog';
import { UsersFilters } from './UsersFilters';
import { UsersTable } from './UsersTable';

const INITIAL_CREATE_FORM = {
    professor_id: '' as number | '',
    email: '',
    password: '123456',
    password_confirmation: '123456',
};

export default function UsersIndex({
    users,
    available_professors,
    filters,
}: UsersIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [createOpen, setCreateOpen] = useState(false);
    const isInitialMount = useRef(true);

    const createForm = useForm({
        ...INITIAL_CREATE_FORM,
    });

    const handleCreateSubmit = () => {
        createForm.post('/users', {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
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
            router.get('/users', {
                search: search || undefined,
                role: filters.role || undefined,
                sort_by: filters.sort_by,
                sort_dir: filters.sort_dir,
            }, { preserveState: true });
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    const updateFilters = useCallback(
        (updates: Partial<UsersIndexProps['filters']>) => {
            router.get('/users', {
                search: ('search' in updates ? updates.search : search) || undefined,
                role: ('role' in updates ? updates.role : filters.role) || undefined,
                sort_by: updates.sort_by ?? filters.sort_by,
                sort_dir: updates.sort_dir ?? filters.sort_dir,
            }, { preserveState: true });
        },
        [search, filters.role, filters.sort_by, filters.sort_dir]
    );

    const handleSort = (column: 'name' | 'role') => {
        const nextDir =
            filters.sort_by === column && filters.sort_dir === 'asc'
                ? 'desc'
                : 'asc';
        updateFilters({ sort_by: column, sort_dir: nextDir });
    };

    return (
        <AppLayout>
            <Head title="Users" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold">Users</h1>

                <UsersFilters
                    search={search}
                    onSearchChange={setSearch}
                    filters={filters}
                    onFiltersChange={updateFilters}
                    onOpenCreate={() => setCreateOpen(true)}
                />

                <UsersTable
                    users={users}
                    filters={filters}
                    onSort={handleSort}
                />

                <CreateGamemasterDialog
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    availableProfessors={available_professors}
                    form={createForm}
                    onSubmit={handleCreateSubmit}
                />
            </div>
        </AppLayout>
    );
}
