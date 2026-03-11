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
    user_id: string;
    sort_dir: 'asc' | 'desc';
};

export type ActivityLogUser = {
    id: number;
    name: string;
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
    activityLogUsers: ActivityLogUser[];
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
    gamemaster_updated: 'Gamemaster/Admin role updated',
    user_deleted: 'User deleted',
    achievement_created: 'Achievement created',
    achievement_updated: 'Achievement updated',
    achievement_deleted: 'Achievement deleted',
    achievement_earned: 'Achievement earned',
    store_item_created: 'Store item created',
    store_item_updated: 'Store item updated',
    store_item_deleted: 'Store item deleted',
    store_redeem: 'Store redeem',
    item_used: 'Item used',
    semester_created: 'Semester created',
    semester_updated: 'Semester updated',
    semester_deleted: 'Semester deleted',
    profile_updated: 'Profile updated',
    password_changed: 'Password changed',
    auth_signin: 'Signed in',
    auth_signout: 'Signed out',
    auth_signup: 'Registered',
    points_transfer_out: 'Transfer out',
    points_transfer_in: 'Transfer in',
    quest_created: 'Quest created',
    quest_updated: 'Quest updated',
    quest_deleted: 'Quest deleted',
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
    const detail = getActionDetail(action);
    if (key === 'item_used' && detail) {
        return `Item - ${detail} used`;
    }
    return ACTION_LABELS[key] ?? action;
}
