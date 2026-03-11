import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StoreItem, StoreItemsFilters } from './types';

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    try {
        const datePart = iso.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        return d.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return '—';
    }
}

function SortIcon({
    column,
    currentSort,
    sortDir,
}: {
    column: string;
    currentSort: string;
    sortDir: string;
}) {
    if (currentSort !== column) {
        return <ArrowUpDown className="ml-1 size-4 opacity-50" />;
    }
    return sortDir === 'asc' ? (
        <ArrowUp className="ml-1 size-4" />
    ) : (
        <ArrowDown className="ml-1 size-4" />
    );
}

type Props = {
    storeItems: StoreItem[];
    filters: StoreItemsFilters;
    onSort: (column: 'name' | 'cost_points' | 'stock' | 'is_visible') => void;
    onEdit: (item: StoreItem) => void;
    onDelete: (item: StoreItem) => void;
    canManage?: boolean;
};

export function StoreItemsTable({
    storeItems,
    filters,
    onSort,
    onEdit,
    onDelete,
    canManage = true,
}: Props) {
    return (
        <div className="overflow-hidden rounded-lg border bg-card">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="h-11 px-4 text-left font-medium">
                                <button
                                    type="button"
                                    className="inline-flex items-center hover:underline"
                                    onClick={() => onSort('name')}
                                >
                                    Name
                                    <SortIcon
                                        column="name"
                                        currentSort={filters.sort_by}
                                        sortDir={filters.sort_dir}
                                    />
                                </button>
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                Description
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                <button
                                    type="button"
                                    className="inline-flex items-center hover:underline"
                                    onClick={() => onSort('cost_points')}
                                >
                                    Cost (points)
                                    <SortIcon
                                        column="cost_points"
                                        currentSort={filters.sort_by}
                                        sortDir={filters.sort_dir}
                                    />
                                </button>
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                <button
                                    type="button"
                                    className="inline-flex items-center hover:underline"
                                    onClick={() => onSort('stock')}
                                >
                                    Stock
                                    <SortIcon
                                        column="stock"
                                        currentSort={filters.sort_by}
                                        sortDir={filters.sort_dir}
                                    />
                                </button>
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                Start date
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                End date
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                <button
                                    type="button"
                                    className="inline-flex items-center hover:underline"
                                    onClick={() => onSort('is_visible')}
                                >
                                    Visible
                                    <SortIcon
                                        column="is_visible"
                                        currentSort={filters.sort_by}
                                        sortDir={filters.sort_dir}
                                    />
                                </button>
                            </th>
                            {canManage && (
                                <th className="h-11 px-4 text-right font-medium">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {storeItems.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={canManage ? 8 : 7}
                                    className="h-24 px-4 text-center text-muted-foreground"
                                >
                                    No store items found.
                                </td>
                            </tr>
                        ) : (
                            storeItems.map((item) => (
                                <tr
                                    key={item.id}
                                    className="border-b transition-colors hover:bg-muted/30"
                                >
                                    <td className="px-4 py-3 font-medium">
                                        {item.name}
                                    </td>
                                    <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                                        {item.description ?? '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.cost_points}
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.stock}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {formatDate(item.start_date)}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {formatDate(item.end_date)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.is_visible ? 'Yes' : 'No'}
                                    </td>
                                    {canManage && (
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8"
                                                    onClick={() => onEdit(item)}
                                                    aria-label="Edit"
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-destructive hover:text-destructive"
                                                    onClick={() => onDelete(item)}
                                                    aria-label="Delete"
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
