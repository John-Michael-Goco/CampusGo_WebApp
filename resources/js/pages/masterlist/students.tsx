import { Head, Link, router, useForm } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { sileo } from 'sileo';
import AppLayout from '@/layouts/app-layout';
import type { MasterlistStudentsProps, Student } from './students/types';
import { CreateStudentDialog } from './students/CreateStudentDialog';
import { DeleteStudentDialog } from './students/DeleteStudentDialog';
import { EditStudentDialog } from './students/EditStudentDialog';
import { StudentsFilters } from './students/StudentsFilters';
import { StudentsTable } from './students/StudentsTable';

export default function MasterlistStudents({
    students,
    filters,
}: MasterlistStudentsProps) {
    const studentItems = students.data ?? [];
    const [search, setSearch] = useState(filters.search);
    const [createOpen, setCreateOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
    const isInitialMount = useRef(true);

    const createForm = useForm({
        student_number: '',
        first_name: '',
        last_name: '',
        course: '',
        year_level: 1,
    });

    const editForm = useForm({
        student_number: '',
        first_name: '',
        last_name: '',
        course: '',
        year_level: 1,
    });

    const openEdit = (student: Student) => {
        setEditingStudent(student);
        editForm.setData({
            student_number: student.student_number,
            first_name: student.first_name,
            last_name: student.last_name,
            course: student.course,
            year_level: student.year_level,
        });
    };

    const filterQuery = () =>
        new URLSearchParams({
            search: search || '',
            course: filters.course || '',
            year_level: filters.year_level || '',
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
        createForm.post(`/masterlist/students?${filterQuery()}`, {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
                sileo.success({
                    title: 'Student added',
                    description: 'The student has been added to the masterlist.',
                    ...toastOptions.success,
                });
            },
            onError: () => {
                sileo.error({
                    title: 'Could not add student',
                    description: 'Please check the form and try again.',
                    ...toastOptions.error,
                });
            },
        });
    };

    const handleEditSubmit = () => {
        if (!editingStudent) return;
        editForm.put(`/masterlist/students/${editingStudent.id}?${filterQuery()}`, {
            preserveScroll: true,
            onSuccess: () => {
                sileo.success({
                    title: 'Student updated',
                    description: 'The student has been updated.',
                    ...toastOptions.success,
                });
            },
            onError: () => {
                sileo.error({
                    title: 'Could not update student',
                    description: 'Please check the form and try again.',
                    ...toastOptions.error,
                });
            },
        });
    };

    const handleDeleteConfirm = () => {
        if (!deletingStudent) return;
        router.delete(`/masterlist/students/${deletingStudent.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingStudent(null);
                sileo.success({
                    title: 'Student deleted',
                    description: 'The student has been removed from the masterlist.',
                    ...toastOptions.success,
                });
            },
            onError: () => {
                sileo.error({
                    title: 'Could not delete student',
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
            router.get('/masterlist/students', {
                search: search || undefined,
                course: filters.course || undefined,
                year_level: filters.year_level || undefined,
                sort_by: filters.sort_by,
                sort_dir: filters.sort_dir,
            }, { preserveState: true });
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    const updateFilters = useCallback(
        (updates: Partial<MasterlistStudentsProps['filters']>) => {
            router.get('/masterlist/students', {
                search: ('search' in updates ? updates.search : search) || undefined,
                course: ('course' in updates ? updates.course : filters.course) || undefined,
                year_level: ('year_level' in updates ? updates.year_level : filters.year_level) || undefined,
                sort_by: updates.sort_by ?? filters.sort_by,
                sort_dir: updates.sort_dir ?? filters.sort_dir,
            }, { preserveState: true });
        },
        [search, filters.course, filters.year_level, filters.sort_by, filters.sort_dir]
    );

    const handleSort = (column: 'student_number' | 'last_name') => {
        const nextDir =
            filters.sort_by === column && filters.sort_dir === 'asc'
                ? 'desc'
                : 'asc';
        updateFilters({ sort_by: column, sort_dir: nextDir });
    };

    return (
        <AppLayout>
            <Head title="Students Masterlist" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold">Students Masterlist</h1>

                <StudentsFilters
                    search={search}
                    onSearchChange={setSearch}
                    filters={filters}
                    onFiltersChange={updateFilters}
                    onOpenCreate={() => setCreateOpen(true)}
                />

                <StudentsTable
                    students={studentItems}
                    filters={filters}
                    onSort={handleSort}
                    onEdit={openEdit}
                    onDelete={setDeletingStudent}
                />

                {students.total > 0 && (
                    <div className="flex items-center justify-between gap-4 border-t pt-4">
                        <p className="text-sm text-muted-foreground">
                            Showing {(students.current_page - 1) * students.per_page + 1} to{' '}
                            {Math.min(students.current_page * students.per_page, students.total)} of{' '}
                            {students.total} entries
                        </p>
                        {students.last_page > 1 && (
                            <div className="flex items-center gap-2">
                                {students.prev_page_url ? (
                                    <Link
                                        href={students.prev_page_url}
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
                                    Page {students.current_page} of {students.last_page}
                                </span>
                                {students.next_page_url ? (
                                    <Link
                                        href={students.next_page_url}
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

                <CreateStudentDialog
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    form={createForm}
                    onSubmit={handleCreateSubmit}
                />

                <EditStudentDialog
                    open={!!editingStudent}
                    onOpenChange={(open) => !open && setEditingStudent(null)}
                    form={editForm}
                    onSubmit={handleEditSubmit}
                />

                <DeleteStudentDialog
                    student={deletingStudent}
                    open={!!deletingStudent}
                    onOpenChange={(open) => !open && setDeletingStudent(null)}
                    onConfirm={handleDeleteConfirm}
                />
            </div>
        </AppLayout>
    );
}
