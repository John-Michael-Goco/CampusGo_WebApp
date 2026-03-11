import { Link } from '@inertiajs/react';
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableScroll,
    TableElement,
    tableHeadClass,
    tableCellClass,
    tableEmptyClass,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { maskEmail   } from './types';
import type {UserListItem, UsersFilters} from './types';

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

const usersHeaderRowClass =
    'border-b border-blue-200/60 bg-gradient-to-r from-blue-50/90 to-blue-50/50 dark:border-blue-900/50 dark:from-blue-950/40 dark:to-blue-950/20 text-foreground';
const usersBodyRowClass =
    'border-b border-border/60 transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-950/20 last:border-b-0';

export function UsersTable({ users, filters, onSort, onDelete, canManage = false }: Props) {
    return (
        <Table className="border-blue-200/60 dark:border-blue-900/40 ring-1 ring-blue-200/20 dark:ring-blue-800/20">
            <TableScroll>
                <TableElement>
                    <thead>
                        <tr className={usersHeaderRowClass}>
                            <th className={tableHeadClass}>
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
                            <th className={tableHeadClass}>
                                Email
                            </th>
                            <th className={tableHeadClass}>
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
                            <th className={tableHeadClass}>
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
                            <th className={tableHeadClass}>
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
                            <th className={cn(tableHeadClass, 'text-right')}>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr className={usersBodyRowClass}>
                                <td
                                    colSpan={6}
                                    className={tableEmptyClass}
                                >
                                    No users found.
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr
                                    key={user.id}
                                    className={usersBodyRowClass}
                                >
                                    <td className={tableCellClass}>{user.name}</td>
                                    <td className={cn(tableCellClass, 'font-mono text-muted-foreground')}>
                                        {maskEmail(user.email)}
                                    </td>
                                    <td className={cn(tableCellClass, 'capitalize')}>
                                        {user.role}
                                    </td>
                                    <td className={tableCellClass}>
                                        {pointsDisplay(user)}
                                    </td>
                                    <td className={tableCellClass}>
                                        {user.level ?? 1}
                                    </td>
                                    <td className={cn(tableCellClass, 'text-right')}>
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
                </TableElement>
            </TableScroll>
        </Table>
    );
}
