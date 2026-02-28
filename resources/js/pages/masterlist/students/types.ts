export const COURSE_OPTIONS = ['BSIT', 'BSCS', 'BSCPe', 'BSCE', 'ACT'] as const;
export const YEAR_LEVEL_OPTIONS = [1, 2, 3, 4] as const;

export type Student = {
    id: number;
    student_number: string;
    first_name: string;
    last_name: string;
    course: string;
    year_level: number;
    is_registered: boolean;
};

export type StudentsFilters = {
    search: string;
    course: string;
    year_level: string;
    sort_by: string;
    sort_dir: string;
};

export type PaginatedStudents = {
    data: Student[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

export type MasterlistStudentsProps = {
    students: PaginatedStudents;
    courses: string[];
    filters: StudentsFilters;
};
