export type QuestionType = 'multiple_choice' | 'qr_scan';

export type Choice = {
    choice_text: string;
    is_correct: boolean;
};

export type Question = {
    question_text: string;
    question_type: QuestionType;
    choices: Choice[];
};

export type StageFormData = {
    stage_number: number;
    location_hint: string;
    max_survivors: number | '';
    passing_score: number | '';
    minimum_participants: number | '';
    stage_deadline: string;
    question_type: QuestionType;
    questions: Question[];
};

export const EMPTY_CHOICE: Choice = { choice_text: '', is_correct: false };

export function createEmptyQuestion(type: QuestionType): Question {
    return {
        question_text: '',
        question_type: type,
        choices: type === 'multiple_choice'
            ? [{ ...EMPTY_CHOICE }, { ...EMPTY_CHOICE }, { ...EMPTY_CHOICE }, { ...EMPTY_CHOICE }]
            : [],
    };
}

export function createEmptyStage(stageNumber: number): StageFormData {
    return {
        stage_number: stageNumber,
        location_hint: '',
        max_survivors: '',
        passing_score: '',
        minimum_participants: '',
        stage_deadline: '',
        question_type: 'multiple_choice',
        questions: [createEmptyQuestion('multiple_choice')],
    };
}
