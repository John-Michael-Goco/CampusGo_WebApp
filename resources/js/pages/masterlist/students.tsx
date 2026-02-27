import { Head, router, useForm } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
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

    const handleCreateSubmit = () => {
        createForm.post('/masterlist/students', {
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEditSubmit = () => {
        if (!editingStudent) return;
        editForm.put(`/masterlist/students/${editingStudent.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingStudent(null);
                editForm.reset();
            },
        });
    };

    const handleDeleteConfirm = () => {
        if (!deletingStudent) return;
        router.delete(`/masterlist/students/${deletingStudent.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingStudent(null),
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
                    students={students}
                    filters={filters}
                    onSort={handleSort}
                    onEdit={openEdit}
                    onDelete={setDeletingStudent}
                />

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
