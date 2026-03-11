import { Link } from '@inertiajs/react';
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableScroll,
    TableElement,
    tableHeadClass,
    tableCellClass,
    tableEmptyClass,
} from '@/components/ui/table';
import type { Semester, SemestersFilters } from './types';

function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    try {
        const datePart = dateStr.split('T')[0];
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

const semestersHeaderRowClass =
    'border-b border-cyan-200/60 bg-gradient-to-r from-cyan-50/90 to-cyan-50/50 dark:border-cyan-900/50 dark:from-cyan-950/40 dark:to-cyan-950/20 text-foreground';
const semestersBodyRowClass =
    'border-b border-border/60 transition-colors hover:bg-cyan-50/40 dark:hover:bg-cyan-950/20 last:border-b-0';

type Props = {
    semesters: Semester[];
    filters: SemestersFilters;
    onSort: (column: 'name' | 'start_date' | 'end_date') => void;
    onEdit: (semester: Semester) => void;
    onDelete: (semester: Semester) => void;
    canManage?: boolean;
};

export function SemestersTable({
    semesters,
    filters,
    onSort,
    onEdit,
    onDelete,
    canManage = true,
}: Props) {
    return (
        <Table className="border-cyan-200/60 dark:border-cyan-900/40 ring-1 ring-cyan-200/20 dark:ring-cyan-800/20">
            <TableScroll>
                <TableElement>
                    <thead>
                        <tr className={semestersHeaderRowClass}>
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
                            <th className={tableHeadClass}>
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
                            <th className={tableHeadClass}>
                                Current
                            </th>
                            {canManage && (
                                <th className={`${tableHeadClass} text-right`}>
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {semesters.length === 0 ? (
                            <tr className={semestersBodyRowClass}>
                                <td
                                    colSpan={canManage ? 5 : 4}
                                    className={tableEmptyClass}
                                >
                                    No semesters found.
                                </td>
                            </tr>
                        ) : (
                            semesters.map((semester) => (
                                <tr
                                    key={semester.id}
                                    className={semestersBodyRowClass}
                                >
                                    <td className={`${tableCellClass} font-medium`}>
                                        {semester.name}
                                    </td>
                                    <td className={`${tableCellClass} text-muted-foreground`}>
                                        {formatDate(semester.start_date)}
                                    </td>
                                    <td className={`${tableCellClass} text-muted-foreground`}>
                                        {formatDate(semester.end_date)}
                                    </td>
                                    <td className={tableCellClass}>
                                        {semester.is_current ? 'Yes' : 'No'}
                                    </td>
                                    {canManage && (
                                        <td className={`${tableCellClass} text-right`}>
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
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </TableElement>
            </TableScroll>
        </Table>
    );
}
