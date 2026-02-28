export const TITLE_OPTIONS = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'] as const;

export type Professor = {
    id: number;
    employee_id: string;
    title: string;
    first_name: string;
    last_name: string;
    department: string;
    is_registered: boolean;
};

export type ProfessorsFilters = {
    search: string;
    title: string;
    sort_by: string;
    sort_dir: string;
};

export type PaginatedProfessors = {
    data: Professor[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

export type MasterlistProfessorsProps = {
    professors: PaginatedProfessors;
    filters: ProfessorsFilters;
};
