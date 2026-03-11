export const REQUIREMENT_TYPE_OPTIONS = [
    { value: 'quest_count', label: 'Quest count' },
    { value: 'level', label: 'Level' },
    { value: 'quest_win', label: 'Quests win' },
    { value: 'complete_quest', label: 'Complete specific quest' },
] as const;

export type Achievement = {
    id: number;
    name: string;
    description: string | null;
    requirement_type: string;
    requirement_value: number;
};

export type AchievementsFilters = {
    search: string;
    sort_by: string;
    sort_dir: string;
};

export type PaginatedAchievements = {
    data: Achievement[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

export type QuestOption = {
    id: number;
    title: string;
};

export type AchievementsPageProps = {
    achievements: PaginatedAchievements;
    quests: QuestOption[];
    filters: AchievementsFilters;
};
