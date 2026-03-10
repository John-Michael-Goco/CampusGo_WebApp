import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Pencil, Trash2 } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import type { Semester, SemestersFilters } from './types';

function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
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
    semesters: Semester[];
    filters: SemestersFilters;
    onSort: (column: 'name' | 'start_date' | 'end_date') => void;
    onEdit: (semester: Semester) => void;
    onDelete: (semester: Semester) => void;
};

export function SemestersTable({
    semesters,
    filters,
    onSort,
    onEdit,
    onDelete,
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
                                <button
                                    type="button"
                                    className="inline-flex items-center hover:underline"
                                    onClick={() => onSort('start_date')}
                                >
                                    Start date
                                    <SortIcon
                                        column="start_date"
                                        currentSort={filters.sort_by}
                                        sortDir={filters.sort_dir}
                                    />
                                </button>
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                <button
                                    type="button"
                                    className="inline-flex items-center hover:underline"
                                    onClick={() => onSort('end_date')}
                                >
                                    End date
                                    <SortIcon
                                        column="end_date"
                                        currentSort={filters.sort_by}
                                        sortDir={filters.sort_dir}
                                    />
                                </button>
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                Current
                            </th>
                            <th className="h-11 px-4 text-right font-medium">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {semesters.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="h-24 px-4 text-center text-muted-foreground"
                                >
                                    No semesters found.
                                </td>
                            </tr>
                        ) : (
                            semesters.map((semester) => (
                                <tr
                                    key={semester.id}
                                    className="border-b transition-colors hover:bg-muted/30"
                                >
                                    <td className="px-4 py-3 font-medium">
                                        {semester.name}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {formatDate(semester.start_date)}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {formatDate(semester.end_date)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {semester.is_current ? 'Yes' : 'No'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                asChild
                                            >
                                                <Link
                                                    href={`/semesters/${semester.id}`}
                                                    aria-label="View"
                                                >
                                                    <Eye className="size-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                onClick={() => onEdit(semester)}
                                                aria-label="Edit"
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-destructive hover:text-destructive"
                                                onClick={() => onDelete(semester)}
                                                aria-label="Delete"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
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
