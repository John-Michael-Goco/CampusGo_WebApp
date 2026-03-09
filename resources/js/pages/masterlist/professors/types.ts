export type Professor = {
    id: number;
    employee_id: string;
    first_name: string;
    last_name: string;
    is_registered: boolean;
};

export type ProfessorsFilters = {
    search: string;
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
