export type EnrollmentSemester = {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
} | null;

export type QuestType = 'daily' | 'event' | 'custom' | 'enrollment';

export const QUEST_TYPE_OPTIONS: { value: QuestType; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'event', label: 'Event' },
    { value: 'custom', label: 'Custom' },
    { value: 'enrollment', label: 'Enrollment' },
];

export const COURSE_OPTIONS = ['BSCS', 'BSIT', 'BSCPe', 'BSCE', 'ACT'] as const;
export const YEAR_LEVEL_OPTIONS = [1, 2, 3, 4] as const;
export const ACT_YEAR_LEVEL_OPTIONS = [1, 2] as const;

export type TargetGroup = {
    target_type: 'everyone' | 'specific';
    course: string;
    year_level: string;
    section: string;
};

export type QuestionTypeLevel = 'multiple_choice' | 'qr_scan';

export type CreateQuestFormData = {
    target: TargetGroup;
    title: string;
    description: string;
    quest_type: QuestType;
    question_type: QuestionTypeLevel;
    num_stages: number | '';
    is_elimination: boolean;
    buy_in_points: number | '';
    reward_points: number | '';
    reward_custom_prize: string;
    max_participants: number | '';
    start_date: string;
    end_date: string;
    creation_cost_points: number | '';
};

export const INITIAL_TARGET: TargetGroup = {
    target_type: 'everyone',
    course: '',
    year_level: '',
    section: '',
};

export const INITIAL_FORM_DATA: CreateQuestFormData = {
    target: { ...INITIAL_TARGET },
    title: '',
    description: '',
    quest_type: 'daily',
    question_type: 'multiple_choice',
    num_stages: 1,
    is_elimination: false,
    buy_in_points: '',
    reward_points: '',
    reward_custom_prize: '',
    max_participants: '',
    start_date: '',
    end_date: '',
    creation_cost_points: '',
};

export function isSimpleQuestType(type: QuestType): boolean {
    return type === 'daily' || type === 'enrollment';
}
