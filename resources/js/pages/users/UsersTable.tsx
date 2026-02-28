import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
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

function questCreditDisplay(user: UserListItem): string {
    if (user.role === 'admin' || user.role === 'professor') {
        return 'Unlimited';
    }
    return String(user.gm_quest_credit ?? 0);
}

function totalPointsDisplay(user: UserListItem): string {
    if (user.role !== 'student') {
        return '—';
    }
    return String(user.total_points ?? 0);
}

type Props = {
    users: UserListItem[];
    filters: UsersFilters;
    onSort: (column: 'name' | 'role') => void;
};

export function UsersTable({ users, filters, onSort }: Props) {
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
                                Quest Credit
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                Total points
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
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
                                        {questCreditDisplay(user)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {totalPointsDisplay(user)}
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
