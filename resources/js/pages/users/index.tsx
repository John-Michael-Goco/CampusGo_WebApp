import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { CreateGamemasterDialog } from './CreateGamemasterDialog';
import { DeleteUserDialog } from './DeleteUserDialog';
import type { UserListItem, UsersIndexProps } from './types';
import { UsersFilters } from './UsersFilters';
import { UsersTable } from './UsersTable';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Users', href: '/users' },
];

const ADD_ROLE_OPTIONS = [
    { value: 'admin', label: 'Admin' },
    { value: 'professor', label: 'Gamemaster' },
] as const;

const INITIAL_CREATE_FORM = {
    professor_id: '' as number | '',
    role: 'professor' as 'admin' | 'professor',
    email: '',
    password: '12345678',
    password_confirmation: '12345678',
};

export default function UsersIndex({
    users,
    available_professors,
    filters,
}: UsersIndexProps) {
    const canManageUsers = (usePage().props as { auth?: { canManageUsers?: boolean } }).auth?.canManageUsers ?? false;
    const userItems = users.data ?? [];
    const [search, setSearch] = useState(filters.search);
    const [createOpen, setCreateOpen] = useState(false);
    const [deletingUser, setDeletingUser] = useState<UserListItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
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

    const handleDeleteConfirm = () => {
        if (!deletingUser) return;
        setIsDeleting(true);
        router.delete(`/users/${deletingUser.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingUser(null);
            },
            onFinish: () => setIsDeleting(false),
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
            router.get('/users', {
                search: search || undefined,
                role: filters.role || undefined,
                sort_by: filters.sort_by,
                sort_dir: filters.sort_dir,
            }, { preserveState: true });
        }, 300);
        return () => clearTimeout(t);
        // Intentionally only when search changes to avoid request loops
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const handleSort = (column: 'name' | 'role' | 'points_balance' | 'level') => {
        const nextDir =
            filters.sort_by === column && filters.sort_dir === 'asc'
                ? 'desc'
                : 'asc';
        updateFilters({ sort_by: column, sort_dir: nextDir });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold">Users</h1>

                <UsersFilters
                    search={search}
                    onSearchChange={setSearch}
                    filters={filters}
                    onFiltersChange={updateFilters}
                    onOpenCreate={() => setCreateOpen(true)}
                    canManage={canManageUsers}
                />

                <UsersTable
                    users={userItems}
                    filters={filters}
                    onSort={handleSort}
                    onDelete={setDeletingUser}
                    canManage={canManageUsers}
                />

                {users.total > 0 && (
                    <div className="flex items-center justify-between gap-4 border-t pt-4">
                        <p className="text-sm text-muted-foreground">
                            Showing {(users.current_page - 1) * users.per_page + 1} to{' '}
                            {Math.min(users.current_page * users.per_page, users.total)} of{' '}
                            {users.total} entries
                        </p>
                        {users.last_page > 1 && (
                            <div className="flex items-center gap-2">
                                {users.prev_page_url ? (
                                    <Link
                                        href={users.prev_page_url}
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
                                    Page {users.current_page} of {users.last_page}
                                </span>
                                {users.next_page_url ? (
                                    <Link
                                        href={users.next_page_url}
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

                {canManageUsers && (
                    <>
                        <CreateGamemasterDialog
                            open={createOpen}
                            onOpenChange={setCreateOpen}
                            availableProfessors={available_professors}
                            form={createForm}
                            roleOptions={ADD_ROLE_OPTIONS}
                            onSubmit={handleCreateSubmit}
                        />
                        <DeleteUserDialog
                            user={deletingUser}
                            open={deletingUser !== null}
                            onOpenChange={(open) => !open && setDeletingUser(null)}
                            onConfirm={handleDeleteConfirm}
                            processing={isDeleting}
                        />
                    </>
                )}

            </div>
        </AppLayout>
    );
}
