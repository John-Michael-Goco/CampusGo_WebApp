import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableScroll,
    TableElement,
    tableHeadClass,
    tableCellClass,
    tableEmptyClass,
} from '@/components/ui/table';
import type { Student, StudentsFilters } from './types';

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

const studentsHeaderRowClass =
    'border-b border-teal-200/60 bg-gradient-to-r from-teal-50/90 to-teal-50/50 dark:border-teal-900/50 dark:from-teal-950/40 dark:to-teal-950/20 text-foreground';
const studentsBodyRowClass =
    'border-b border-border/60 transition-colors hover:bg-teal-50/40 dark:hover:bg-teal-950/20 last:border-b-0';

type Props = {
    students: Student[];
    filters: StudentsFilters;
    onSort: (column: 'student_number' | 'last_name' | 'section') => void;
    onEdit: (student: Student) => void;
    onDelete: (student: Student) => void;
    canManage?: boolean;
};

export function StudentsTable({
    students,
    filters,
    onSort,
    onEdit,
    onDelete,
    canManage = true,
}: Props) {
    return (
        <Table className="border-teal-200/60 dark:border-teal-900/40 ring-1 ring-teal-200/20 dark:ring-teal-800/20">
            <TableScroll>
                <TableElement>
                    <thead>
                        <tr className={studentsHeaderRowClass}>
                            <th className={tableHeadClass}>
                                <button
                                    type="button"
                                    className="inline-flex items-center hover:underline"
                                    onClick={() => onSort('student_number')}
                                >
                                    Student ID
                                    <SortIcon
                                        column="student_number"
                                        currentSort={filters.sort_by}
                                        sortDir={filters.sort_dir}
                                    />
                                </button>
                            </th>
                            <th className={tableHeadClass}>
                                <button
                                    type="button"
                                    className="inline-flex items-center hover:underline"
                                    onClick={() => onSort('last_name')}
                                >
                                    Last name
                                    <SortIcon
                                        column="last_name"
                                        currentSort={filters.sort_by}
                                        sortDir={filters.sort_dir}
                                    />
                                </button>
                            </th>
                            <th className={tableHeadClass}>
                                First name
                            </th>
                            <th className={tableHeadClass}>
                                Course
                            </th>
                            <th className={tableHeadClass}>
                                Year level
                            </th>
                            <th className={tableHeadClass}>
                                <button
                                    type="button"
                                    className="inline-flex items-center hover:underline"
                                    onClick={() => onSort('section')}
                                >
                                    Section
                                    <SortIcon
                                        column="section"
                                        currentSort={filters.sort_by}
                                        sortDir={filters.sort_dir}
                                    />
                                </button>
                            </th>
                            <th className={tableHeadClass}>
                                Is registered
                            </th>
                            <th className={tableHeadClass}>
                                Is enrolled
                            </th>
                            {canManage && (
                                <th className={`${tableHeadClass} text-right`}>
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {students.length === 0 ? (
                            <tr className={studentsBodyRowClass}>
                                <td
                                    colSpan={canManage ? 9 : 8}
                                    className={tableEmptyClass}
                                >
                                    No students found.
                                </td>
                            </tr>
                        ) : (
                            students.map((student) => (
                                <tr
                                    key={student.id}
                                    className={studentsBodyRowClass}
                                >
                                    <td className="px-4 py-3 font-mono text-muted-foreground">
                                        {student.student_number}
                                    </td>
                                    <td className={tableCellClass}>
                                        {student.last_name}
                                    </td>
                                    <td className={tableCellClass}>
                                        {student.first_name}
                                    </td>
                                    <td className={tableCellClass}>
                                        {student.course}
                                    </td>
                                    <td className={tableCellClass}>
                                        {student.year_level}
                                    </td>
                                    <td className={tableCellClass}>
                                        {student.section ?? '—'}
                                    </td>
                                    <td className={tableCellClass}>
                                        {student.is_registered ? (
                                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                Yes
                                            </span>
                                        ) : (
                                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                                No
                                            </span>
                                        )}
                                    </td>
                                    <td className={tableCellClass}>
                                        {student.is_enrolled ? (
                                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                Yes
                                            </span>
                                        ) : (
                                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                                No
                                            </span>
                                        )}
                                    </td>
                                    {canManage && (
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8"
                                                    onClick={() => onEdit(student)}
                                                    aria-label="Edit"
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-destructive hover:text-destructive"
                                                    onClick={() => onDelete(student)}
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
