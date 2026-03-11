import { Link } from '@inertiajs/react';
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { maskEmail, type UserListItem, type UsersFilters } from './types';

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

function pointsDisplay(user: UserListItem): string {
    return String(user.points_balance ?? 0);
}

type Props = {
    users: UserListItem[];
    filters: UsersFilters;
    onSort: (column: 'name' | 'role' | 'points_balance' | 'level') => void;
    onDelete: (user: UserListItem) => void;
    canManage?: boolean;
};

export function UsersTable({ users, filters, onSort, onDelete, canManage = false }: Props) {
    return (
        <div className="rounded-lg border bg-card overflow-hidden">
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
                                Email
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                <button
                                    type="button"
                                    className="inline-flex items-center hover:underline"
                                    onClick={() => onSort('role')}
                                >
                                    Role
                                    <SortIcon
                                        column="role"
                                        currentSort={filters.sort_by}
                                        sortDir={filters.sort_dir}
                                    />
                                </button>
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                <button
                                    type="button"
                                    className="inline-flex items-center hover:underline"
                                    onClick={() => onSort('points_balance')}
                                >
                                    Points
                                    <SortIcon
                                        column="points_balance"
                                        currentSort={filters.sort_by}
                                        sortDir={filters.sort_dir}
                                    />
                                </button>
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                <button
                                    type="button"
                                    className="inline-flex items-center hover:underline"
                                    onClick={() => onSort('level')}
                                >
                                    Level
                                    <SortIcon
                                        column="level"
                                        currentSort={filters.sort_by}
                                        sortDir={filters.sort_dir}
                                    />
                                </button>
                            </th>
                            <th className="h-11 px-4 text-right font-medium">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="h-24 px-4 text-center text-muted-foreground"
                                >
                                    No users found.
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr
                                    key={user.id}
                                    className="border-b transition-colors hover:bg-muted/30"
                                >
                                    <td className="px-4 py-3">{user.name}</td>
                                    <td className="px-4 py-3 font-mono text-muted-foreground">
                                        {maskEmail(user.email)}
                                    </td>
                                    <td className="px-4 py-3 capitalize">
                                        {user.role}
                                    </td>
                                    <td className="px-4 py-3">
                                        {pointsDisplay(user)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {user.level ?? 1}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                asChild
                                                aria-label="View"
                                            >
                                                <Link href={`/users/${user.id}`}>
                                                    <Eye className="size-4" />
                                                </Link>
                                            </Button>
                                            {canManage && user.email !== 'admin@email.com' && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                                                    aria-label="Delete"
                                                    onClick={() => onDelete(user)}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
