import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Calendar, Search } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export type EnrolledStudent = {
    id: number;
    name: string;
    email: string;
    student_number: string;
    course: string;
    year_level: number | string;
    section: string;
};

export type SemesterShowProps = {
    semester: {
        id: number;
        name: string;
        start_date: string;
        end_date: string;
        is_current: boolean;
    };
    enrolledStudents: EnrolledStudent[];
};

function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return '—';
    }
}

export default function SemesterShowPage({
    semester,
    enrolledStudents,
}: SemesterShowProps) {
    const [search, setSearch] = useState('');
    const [courseFilter, setCourseFilter] = useState<string>('');
    const [yearFilter, setYearFilter] = useState<string>('');
    const [sectionFilter, setSectionFilter] = useState<string>('');

    const uniqueCourses = useMemo(() => {
        const set = new Set(
            enrolledStudents.map((s) => String(s.course || '').trim()).filter(Boolean)
        );
        return Array.from(set).sort();
    }, [enrolledStudents]);

    const uniqueYears = useMemo(() => {
        const set = new Set(
            enrolledStudents.map((s) => String(s.year_level ?? '').trim()).filter(Boolean)
        );
        return Array.from(set).sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true })
        );
    }, [enrolledStudents]);

    const uniqueSections = useMemo(() => {
        const set = new Set(
            enrolledStudents.map((s) => String(s.section || '').trim()).filter(Boolean)
        );
        return Array.from(set).sort();
    }, [enrolledStudents]);

    const filteredAndSorted = useMemo(() => {
        const term = search.trim().toLowerCase();
        let list = term
            ? enrolledStudents.filter(
                  (s) =>
                      s.name.toLowerCase().includes(term) ||
                      String(s.student_number).toLowerCase().includes(term) ||
                      String(s.course).toLowerCase().includes(term) ||
                      String(s.section).toLowerCase().includes(term) ||
                      String(s.year_level).toLowerCase().includes(term)
              )
            : [...enrolledStudents];

        if (courseFilter) {
            list = list.filter(
                (s) => String(s.course ?? '').trim() === courseFilter
            );
        }
        if (yearFilter) {
            list = list.filter(
                (s) => String(s.year_level ?? '').trim() === yearFilter
            );
        }
        if (sectionFilter) {
            list = list.filter(
                (s) => String(s.section ?? '').trim() === sectionFilter
            );
        }
        return list;
    }, [
        enrolledStudents,
        search,
        courseFilter,
        yearFilter,
        sectionFilter,
    ]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Academic management', href: '/masterlist/students' },
        { title: 'Semester', href: '/semesters' },
        { title: semester.name, href: `/semesters/${semester.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={semester.name} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold">
                            {semester.name}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {semester.is_current
                                ? 'Current semester'
                                : 'Past or upcoming semester'}
                        </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/semesters">Back to semesters</Link>
                    </Button>
                </div>

                <div className="rounded-lg border bg-card p-4">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
                        <Calendar className="size-4 text-muted-foreground" />
                        Date range
                    </h2>
                    <dl className="grid gap-2 sm:grid-cols-2">
                        <div>
                            <dt className="text-xs text-muted-foreground">
                                Start date
                            </dt>
                            <dd className="font-medium">
                                {formatDate(semester.start_date)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-muted-foreground">
                                End date
                            </dt>
                            <dd className="font-medium">
                                {formatDate(semester.end_date)}
                            </dd>
                        </div>
                    </dl>
                </div>

                <div className="rounded-lg border bg-card overflow-hidden">
                    <div className="border-b bg-muted/50 px-4 py-3">
                        <h2 className="font-medium">Enrolled students</h2>
                        <p className="text-sm text-muted-foreground">
                            {enrolledStudents.length} student
                            {enrolledStudents.length !== 1 ? 's' : ''} enrolled
                            in this semester
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
                        <div className="relative min-w-[200px] flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by name, number, course..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select
                            value={courseFilter || 'all'}
                            onValueChange={(v) =>
                                setCourseFilter(v === 'all' ? '' : v)
                            }
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Course" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All courses</SelectItem>
                                {uniqueCourses.map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {c}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={yearFilter || 'all'}
                            onValueChange={(v) =>
                                setYearFilter(v === 'all' ? '' : v)
                            }
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All years</SelectItem>
                                {uniqueYears.map((y) => (
                                    <SelectItem key={y} value={y}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={sectionFilter || 'all'}
                            onValueChange={(v) =>
                                setSectionFilter(v === 'all' ? '' : v)
                            }
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Section" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All sections</SelectItem>
                                {uniqueSections.map((sec) => (
                                    <SelectItem key={sec} value={sec}>
                                        {sec}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="h-10 px-4 text-left font-medium">
                                        Name
                                    </th>
                                    <th className="h-10 px-4 text-left font-medium">
                                        Student number
                                    </th>
                                    <th className="h-10 px-4 text-left font-medium">
                                        Course
                                    </th>
                                    <th className="h-10 px-4 text-left font-medium">
                                        Year
                                    </th>
                                    <th className="h-10 px-4 text-left font-medium">
                                        Section
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSorted.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="h-24 px-4 text-center text-muted-foreground"
                                        >
                                            {enrolledStudents.length === 0
                                                ? 'No students enrolled yet.'
                                                : 'No students match your search.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAndSorted.map((student) => (
                                        <tr
                                            key={student.id}
                                            className="border-b transition-colors hover:bg-muted/20"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {student.name}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {student.student_number}
                                            </td>
                                            <td className="px-4 py-3">
                                                {student.course}
                                            </td>
                                            <td className="px-4 py-3">
                                                {student.year_level}
                                            </td>
                                            <td className="px-4 py-3">
                                                {student.section}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
