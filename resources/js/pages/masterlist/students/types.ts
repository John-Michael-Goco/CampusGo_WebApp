export const COURSE_OPTIONS = ['BSIT', 'BSCS', 'BSCPe', 'BSCE', 'ACT'] as const;
export const YEAR_LEVEL_OPTIONS = [1, 2, 3, 4] as const;
/** ACT course only has year levels 1 and 2. */
export const ACT_YEAR_LEVEL_OPTIONS = [1, 2] as const;

export type Student = {
    id: number;
    student_number: string;
    first_name: string;
    last_name: string;
    course: string;
    year_level: number;
    section: string | null;
    is_registered: boolean;
    is_enrolled: boolean;
};

export type StudentsFilters = {
    search: string;
    course: string;
    year_level: string;
    section: string;
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
    sections: string[];
    filters: StudentsFilters;
};
