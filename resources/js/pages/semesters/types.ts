export type Semester = {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
};

export type SemestersFilters = {
    search: string;
    sort_by: string;
    sort_dir: string;
};

export type PaginatedSemesters = {
    data: Semester[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

export type SemestersPageProps = {
    semesters: PaginatedSemesters;
    filters: SemestersFilters;
};
