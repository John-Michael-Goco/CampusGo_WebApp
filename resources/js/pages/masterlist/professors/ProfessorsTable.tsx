import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Professor, ProfessorsFilters } from './types';

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
    professors: Professor[];
    filters: ProfessorsFilters;
    onSort: (column: 'employee_id' | 'last_name') => void;
    onEdit: (professor: Professor) => void;
    onDelete: (professor: Professor) => void;
};

export function ProfessorsTable({
    professors,
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
                                    onClick={() => onSort('employee_id')}
                                >
                                    Employee ID
                                    <SortIcon
                                        column="employee_id"
                                        currentSort={filters.sort_by}
                                        sortDir={filters.sort_dir}
                                    />
                                </button>
                            </th>
                            <th className="h-11 px-4 text-left font-medium">
                                Title
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
                                Is registered
                            </th>
                            <th className="h-11 px-4 text-right font-medium">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {professors.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="h-24 px-4 text-center text-muted-foreground"
                                >
                                    No professors found.
                                </td>
                            </tr>
                        ) : (
                            professors.map((professor) => (
                                <tr
                                    key={professor.id}
                                    className="border-b transition-colors hover:bg-muted/30"
                                >
                                    <td className="px-4 py-3 font-mono text-muted-foreground">
                                        {professor.employee_id}
                                    </td>
                                    <td className="px-4 py-3">
                                        {professor.title}
                                    </td>
                                    <td className="px-4 py-3">
                                        {professor.last_name}
                                    </td>
                                    <td className="px-4 py-3">
                                        {professor.first_name}
                                    </td>
                                    <td className="px-4 py-3">
                                        {professor.is_registered ? (
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
                                                onClick={() => onEdit(professor)}
                                                aria-label="Edit"
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-destructive hover:text-destructive"
                                                onClick={() => onDelete(professor)}
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
