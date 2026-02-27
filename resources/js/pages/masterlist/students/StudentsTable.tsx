import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

type Props = {
    students: Student[];
    filters: StudentsFilters;
    onSort: (column: 'student_number' | 'last_name') => void;
    onEdit: (student: Student) => void;
    onDelete: (student: Student) => void;
};

export function StudentsTable({
    students,
    filters,
    onSort,
    onEdit,
    onDelete,
}: Props) {
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
                            <th className="h-11 px-4 text-left font-medium">
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
                            <th className="h-11 px-4 text-left font-medium">
                                First name
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                Course
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                Year level
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                Is registered
                            </th>
                            <th className="h-11 px-4 text-right font-medium">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="h-24 px-4 text-center text-muted-foreground"
                                >
                                    No students found.
                                </td>
                            </tr>
                        ) : (
                            students.map((student) => (
                                <tr
                                    key={student.id}
                                    className="border-b transition-colors hover:bg-muted/30"
                                >
                                    <td className="px-4 py-3 font-mono text-muted-foreground">
                                        {student.student_number}
                                    </td>
                                    <td className="px-4 py-3">
                                        {student.last_name}
                                    </td>
                                    <td className="px-4 py-3">
                                        {student.first_name}
                                    </td>
                                    <td className="px-4 py-3">
                                        {student.course}
                                    </td>
                                    <td className="px-4 py-3">
                                        {student.year_level}
                                    </td>
                                    <td className="px-4 py-3">
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
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
