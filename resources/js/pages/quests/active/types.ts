export type QuestType = 'daily' | 'event' | 'custom' | 'enrollment';
export type QuestStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export type ActiveQuest = {
    id: number;
    title: string;
    quest_type: QuestType;
    question_type: string;
    status: QuestStatus;
    stages_count: number;
    start_date: string | null;
    end_date: string | null;
    reward_points: number;
    max_participants: number | null;
    current_participants: number;
    creator?: { id: number; name: string } | null;
};

export type ActiveQuestsFilters = {
    search: string;
    quest_type: '' | QuestType;
    created_by_me: boolean;
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
