export type QuestType = 'daily' | 'event' | 'custom' | 'enrollment';
export type QuestStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export type ActiveQuest = {
    id: number;
    title: string;
    quest_type: QuestType;
    status: QuestStatus;
    start_date: string | null;
    end_date: string | null;
    buy_in_points: number;
    reward_points: number;
    max_participants: number | null;
    current_participants: number;
};

export type ActiveQuestsFilters = {
    search: string;
    quest_type: '' | QuestType;
    sort_by: string;
    sort_dir: 'asc' | 'desc';
};

export type ActiveQuestsPagination = {
    data: ActiveQuest[];
    total: number;
    current_page: number;
    per_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

export type ActiveQuestsPageProps = {
    quests: ActiveQuestsPagination;
    filters: ActiveQuestsFilters;
};
