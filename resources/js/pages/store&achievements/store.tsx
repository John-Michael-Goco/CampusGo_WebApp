import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { sileo } from 'sileo';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { StoreItem, StorePageProps } from './store/types';
import { StoreItemsFilters } from './store/StoreItemsFilters';
import { StoreItemsTable } from './store/StoreItemsTable';
import { CreateStoreItemDialog } from './store/CreateStoreItemDialog';
import { EditStoreItemDialog } from './store/EditStoreItemDialog';
import { DeleteStoreItemDialog } from './store/DeleteStoreItemDialog';
import type { StoreItemFormData } from './store/StoreItemFormFields';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Store & Achievements', href: '/store' },
    { title: 'Store', href: '/store' },
];

function toDateTimeLocal(iso: string | null): string {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
        return '';
    }
}

export default function StorePage({
    storeItems,
    filters,
}: StorePageProps) {
    const canManageStore = (usePage().props as { auth?: { canManageStore?: boolean } }).auth?.canManageStore ?? false;
    const items = storeItems.data ?? [];
    const [search, setSearch] = useState(filters.search);
    const [createOpen, setCreateOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
    const [deletingItem, setDeletingItem] = useState<StoreItem | null>(null);
    const isInitialMount = useRef(true);

    const createForm = useForm<StoreItemFormData>({
        name: '',
        description: '',
        cost_points: '',
        stock: '',
        start_date: '',
        end_date: '',
        is_visible: true,
    });

    const editForm = useForm<StoreItemFormData>({
        name: '',
        description: '',
        cost_points: '',
        stock: '',
        start_date: '',
        end_date: '',
        is_visible: true,
    });

    const openEdit = (item: StoreItem) => {
        setEditingItem(item);
        editForm.setData({
            name: item.name,
            description: item.description ?? '',
            cost_points: item.cost_points,
            stock: item.stock,
            start_date: toDateTimeLocal(item.start_date) || '',
            end_date: toDateTimeLocal(item.end_date) || '',
            is_visible: item.is_visible,
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
        createForm.post(`/store?${filterQuery()}`, {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
                sileo.success({
                    title: 'Store item added',
                    description: 'The item has been created.',
                    ...toastOptions.success,
                });
            },
            onError: () => {
                sileo.error({
                    title: 'Could not add store item',
                    description: 'Please check the form and try again.',
                    ...toastOptions.error,
                });
            },
        });
    };

    const handleEditSubmit = () => {
        if (!editingItem) return;
        editForm.put(`/store/${editingItem.id}?${filterQuery()}`, {
            preserveScroll: true,
            onSuccess: () => {
                sileo.success({
                    title: 'Store item updated',
                    description: 'The item has been updated.',
                    ...toastOptions.success,
                });
            },
            onError: () => {
                sileo.error({
                    title: 'Could not update store item',
                    description: 'Please check the form and try again.',
                    ...toastOptions.error,
                });
            },
        });
    };

    const handleDeleteConfirm = () => {
        if (!deletingItem) return;
        router.delete(`/store/${deletingItem.id}?${filterQuery()}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingItem(null);
                sileo.success({
                    title: 'Store item deleted',
                    description: 'The item has been removed.',
                    ...toastOptions.success,
                });
            },
            onError: () => {
                sileo.error({
                    title: 'Could not delete store item',
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
                '/store',
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
        (updates: Partial<StorePageProps['filters']>) => {
            router.get(
                '/store',
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
            column: 'name' | 'cost_points' | 'stock' | 'is_visible'
    ) => {
        const nextDir =
            filters.sort_by === column && filters.sort_dir === 'asc'
                ? 'desc'
                : 'asc';
        updateFilters({ sort_by: column, sort_dir: nextDir });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Store" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold">Store</h1>

                <StoreItemsFilters
                    search={search}
                    onSearchChange={setSearch}
                    onOpenCreate={() => setCreateOpen(true)}
                    canManage={canManageStore}
                />

                <StoreItemsTable
                    storeItems={items}
                    filters={filters}
                    onSort={handleSort}
                    onEdit={openEdit}
                    onDelete={setDeletingItem}
                    canManage={canManageStore}
                />

                {storeItems.total > 0 && (
                    <div className="flex items-center justify-between gap-4 border-t pt-4">
                        <p className="text-sm text-muted-foreground">
                            Showing{' '}
                            {(storeItems.current_page - 1) *
                                storeItems.per_page +
                                1}{' '}
                            to{' '}
                            {Math.min(
                                storeItems.current_page * storeItems.per_page,
                                storeItems.total
                            )}{' '}
                            of {storeItems.total} entries
                        </p>
                        {storeItems.last_page > 1 && (
                            <div className="flex items-center gap-2">
                                {storeItems.prev_page_url ? (
                                    <Link
                                        href={storeItems.prev_page_url}
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
                                    Page {storeItems.current_page} of{' '}
                                    {storeItems.last_page}
                                </span>
                                {storeItems.next_page_url ? (
                                    <Link
                                        href={storeItems.next_page_url}
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

                {canManageStore && (
                    <>
                        <CreateStoreItemDialog
                            open={createOpen}
                            onOpenChange={setCreateOpen}
                            form={createForm}
                            onSubmit={handleCreateSubmit}
                        />
                        <EditStoreItemDialog
                            open={!!editingItem}
                            onOpenChange={(open) => !open && setEditingItem(null)}
                            form={editForm}
                            onSubmit={handleEditSubmit}
                        />
                        <DeleteStoreItemDialog
                            storeItem={deletingItem}
                            open={!!deletingItem}
                            onOpenChange={(open) => !open && setDeletingItem(null)}
                            onConfirm={handleDeleteConfirm}
                        />
                    </>
                )}
            </div>
        </AppLayout>
    );
}
