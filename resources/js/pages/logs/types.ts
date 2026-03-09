export type LogEntry = {
    id: number;
    user_id: number;
    action: string;
    timestamp: string;
    user: { id: number; name: string; email?: string } | null;
};

export type LogsFilters = {
    search: string;
    date_from: string;
    date_to: string;
    sort_dir: 'asc' | 'desc';
};

export type PaginatedLogs = {
    data: LogEntry[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

export type LogsPageProps = {
    logs: PaginatedLogs;
    filters: LogsFilters;
};

/** Action key (prefix before ':') to display label. Align with backend ActivityLog::ACTION_* constants. */
export const ACTION_LABELS: Record<string, string> = {
    student_created: 'Student created',
    student_updated: 'Student updated',
    student_deleted: 'Student deleted',
    professor_created: 'Professor created',
    professor_updated: 'Professor updated',
    professor_deleted: 'Professor deleted',
    gamemaster_created: 'Gamemaster created',
    achievement_created: 'Achievement created',
    achievement_updated: 'Achievement updated',
    achievement_deleted: 'Achievement deleted',
    store_item_created: 'Store item created',
    store_item_updated: 'Store item updated',
    store_item_deleted: 'Store item deleted',
    auth_signin: 'Signed in (API)',
    auth_signout: 'Signed out (API)',
    auth_signup: 'Registered (API)',
};

export function getActionKey(action: string): string {
    const colon = action.indexOf(':');
    return colon >= 0 ? action.slice(0, colon).trim() : action.trim();
}

export function getActionDetail(action: string): string | null {
    const colon = action.indexOf(':');
    if (colon < 0) return null;
    const detail = action.slice(colon + 1).trim();
    return detail || null;
}

export function getActionDisplayLabel(action: string): string {
    const key = getActionKey(action);
    return ACTION_LABELS[key] ?? action;
}
