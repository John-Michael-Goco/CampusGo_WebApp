export const ROLE_OPTIONS = ['student', 'professor', 'admin'] as const;

export type UserRole = (typeof ROLE_OPTIONS)[number];

export type UserListItem = {
    id: number;
    name: string;
    email: string;
    role: string;
    gm_quest_credit: number;
    total_points: number;
};

export type UsersFilters = {
    search: string;
    role: string;
    sort_by: string;
    sort_dir: string;
};

export type AvailableProfessor = {
    id: number;
    employee_id: string;
    title: string;
    first_name: string;
    last_name: string;
};

export type UsersIndexProps = {
    users: UserListItem[];
    available_professors: AvailableProfessor[];
    filters: UsersFilters;
};

export function formatProfessorName(p: AvailableProfessor): string {
    return `${p.title} ${p.last_name}, ${p.first_name}`;
}

/**
 * Mask email for display: show first char, then ***, then last char before @,
 * then @ and domain with first char + *** + last part (e.g. j***n@e***.com).
 */
export function maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    const localMasked =
        local.length <= 2
            ? local[0] + '***'
            : local[0] + '***' + local[local.length - 1];
    const dotIdx = domain.indexOf('.');
    const domainMasked =
        dotIdx <= 0
            ? domain[0] + '***'
            : domain[0] + '***' + domain.slice(dotIdx);
    return `${localMasked}@${domainMasked}`;
}
