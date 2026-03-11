import { Trash2, Plus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { StageFormData, QuestionType, Question, Choice } from './stages-types';
import { createEmptyQuestion, EMPTY_CHOICE } from './stages-types';
import type { QuestType, QuestionTypeLevel } from './types';

function parseQuestDate(value: string | ''): Date | undefined {
    if (!value || typeof value !== 'string') return undefined;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
}

type Props = {
    stage: StageFormData;
    questType: QuestType;
    questionType: QuestionTypeLevel;
    isElimination: boolean;
    /** Quest-level max participants; used to cap first stage's max survivors */
    questMaxParticipants?: number | '';
    /** Quest start/end from first form; stage deadline must be within this range */
    questStartDate?: string | '';
    questEndDate?: string | '';
    onChange: (stage: StageFormData) => void;
};

export function StageForm({
    stage,
    questType,
    questionType,
    isElimination,
    questMaxParticipants,
    questStartDate,
    questEndDate,
    onChange,
}: Props) {
    const isEnrollment = questType === 'enrollment';

    const update = <K extends keyof StageFormData>(key: K, value: StageFormData[K]) => {
        onChange({ ...stage, [key]: value });
    };

    const effectiveQuestionType: QuestionType = isEnrollment ? 'qr_scan' : questionType;

    const updateQuestion = (idx: number, question: Question) => {
        const next = [...stage.questions];
        next[idx] = question;
        update('questions', next);
    };

    const addQuestion = () => {
        update('questions', [...stage.questions, createEmptyQuestion(effectiveQuestionType)]);
    };

    const removeQuestion = (idx: number) => {
        if (stage.questions.length <= 1) return;
        update('questions', stage.questions.filter((_, i) => i !== idx));
    };

    const updateChoice = (qIdx: number, cIdx: number, choice: Choice) => {
        const q = { ...stage.questions[qIdx] };
        const choices = [...q.choices];
        choices[cIdx] = choice;
        q.choices = choices;
        updateQuestion(qIdx, q);
    };

    const setCorrectChoice = (qIdx: number, cIdx: number) => {
        const q = { ...stage.questions[qIdx] };
        q.choices = q.choices.map((c, i) => ({ ...c, is_correct: i === cIdx }));
        updateQuestion(qIdx, q);
    };

    const addChoice = (qIdx: number) => {
        const q = { ...stage.questions[qIdx] };
        q.choices = [...q.choices, { ...EMPTY_CHOICE }];
        updateQuestion(qIdx, q);
    };

    const removeChoice = (qIdx: number, cIdx: number) => {
        const q = { ...stage.questions[qIdx] };
        if (q.choices.length <= 2) return;
        q.choices = q.choices.filter((_, i) => i !== cIdx);
        updateQuestion(qIdx, q);
    };

    return (
        <fieldset className="grid gap-5 rounded-lg border p-5">
            <legend className="px-2 text-sm font-semibold">
                Stage {stage.stage_number}
            </legend>

            {/* Location hint */}
            <div className="grid gap-2">
                <Label>Location hint</Label>
                <Input
                    value={stage.location_hint}
                    onChange={(e) => update('location_hint', e.target.value)}
                    placeholder="e.g. Near the library entrance"
                />
            </div>

            {/* Max survivors + Min participants + Deadline (elimination only) */}
            {isElimination && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="grid gap-2">
                        <Label>
                            Max survivors
                            {stage.stage_number === 1 && typeof questMaxParticipants === 'number' && questMaxParticipants > 0 && (
                                <span className="ml-1.5 text-muted-foreground font-normal">
                                    (max {questMaxParticipants} from quest)
                                </span>
                            )}
                        </Label>
                        <Input
                            type="number"
                            min={1}
                            max={stage.stage_number === 1 && typeof questMaxParticipants === 'number' && questMaxParticipants > 0 ? questMaxParticipants : undefined}
                            value={stage.max_survivors}
                            onChange={(e) => {
                                const raw = e.target.value === '' ? '' : parseInt(e.target.value, 10) || 1;
                                let newMax = raw;
                                if (stage.stage_number === 1 && typeof questMaxParticipants === 'number' && questMaxParticipants > 0 && typeof raw === 'number' && raw > questMaxParticipants) {
                                    newMax = questMaxParticipants;
                                }
                                const finalMax = typeof newMax === 'number' ? newMax : 0;
                                const currentMin = typeof stage.minimum_participants === 'number' ? stage.minimum_participants : 0;
                                if (finalMax > 0 && currentMin > finalMax) {
                                    onChange({
                                        ...stage,
                                        max_survivors: newMax as number | '',
                                        minimum_participants: finalMax,
                                    });
                                } else {
                                    update('max_survivors', newMax as number | '');
                                }
                            }}
                            placeholder="e.g. 20"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label className="flex items-center gap-1.5">
                            Min participants
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="size-4 text-muted-foreground cursor-help" aria-label="Info" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                        If minimum participants is not met by the stage deadline, the stage (and quest) will be considered failed or cancelled. Cannot exceed max survivors.
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </Label>
                        <Input
                            type="number"
                            min={1}
                            max={typeof stage.max_survivors === 'number' && stage.max_survivors > 0 ? stage.max_survivors : undefined}
                            value={stage.minimum_participants}
                            onChange={(e) => {
                                const raw = e.target.value === '' ? '' : parseInt(e.target.value, 10) || 1;
                                const cap = typeof stage.max_survivors === 'number' && stage.max_survivors > 0 ? stage.max_survivors : undefined;
                                if (typeof raw === 'number' && cap !== undefined && raw > cap) {
                                    update('minimum_participants', cap);
                                } else {
                                    update('minimum_participants', raw);
                                }
                            }}
                            placeholder="e.g. 5"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label className="flex items-center gap-1.5">
                            Stage deadline
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="size-4 text-muted-foreground cursor-help" aria-label="Info" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                        Must be within the quest start and end dates. If minimum participants is not met by this deadline, the stage will be marked failed or cancelled.
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </Label>
                        <DateTimePicker
                            value={stage.stage_deadline}
                            onChange={(val) => update('stage_deadline', val)}
                            placeholder="Pick deadline"
                            minDate={parseQuestDate(questStartDate ?? '')}
                            maxDate={parseQuestDate(questEndDate ?? '')}
                        />
                    </div>
                </div>
            )}

            {/* Question type (read-only, set at quest level) */}
            <div className="grid gap-2">
                <Label>Question type</Label>
                <p className="text-sm text-muted-foreground rounded-md border bg-muted/30 px-3 py-2">
                    {effectiveQuestionType === 'qr_scan'
                        ? 'QR scan only'
                        : 'Multiple choice'}
                    {isEnrollment && ' — enrollment quests use QR scan for all stages'}
                </p>
            </div>

            {/* Passing score (non-elimination + multiple choice only) */}
            {!isElimination && effectiveQuestionType === 'multiple_choice' && (
                <div className="grid gap-2">
                    <Label>Passing score</Label>
                    <Input
                        type="number"
                        min={1}
                        value={stage.passing_score}
                        onChange={(e) =>
                            update('passing_score', e.target.value === '' ? '' : parseInt(e.target.value, 10) || 1)
                        }
                        placeholder="Min correct answers to pass"
                    />
                </div>
            )}

            {/* Questions (multiple_choice only) */}
            {effectiveQuestionType === 'multiple_choice' && (
                <div className="grid gap-4">
                    {stage.questions.map((question, qIdx) => (
                        <div key={qIdx} className="grid gap-3 rounded-md border bg-muted/30 p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                    Question {qIdx + 1}
                                </span>
                                {stage.questions.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeQuestion(qIdx)}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label>Question text</Label>
                                <Textarea
                                    value={question.question_text}
                                    onChange={(e) =>
                                        updateQuestion(qIdx, { ...question, question_text: e.target.value })
                                    }
                                    placeholder="Enter the question..."
                                    rows={2}
                                />
                            </div>

                            <div className="grid gap-3">
                                <Label>Choices (select the correct one)</Label>
                                {question.choices.map((choice, cIdx) => (
                                    <div key={cIdx} className="flex items-center gap-2">
                                        <Checkbox
                                            checked={choice.is_correct}
                                            onCheckedChange={() => setCorrectChoice(qIdx, cIdx)}
                                        />
                                        <Input
                                            value={choice.choice_text}
                                            onChange={(e) =>
                                                updateChoice(qIdx, cIdx, {
                                                    ...choice,
                                                    choice_text: e.target.value,
                                                })
                                            }
                                            placeholder={`Choice ${cIdx + 1}`}
                                            className="flex-1"
                                        />
                                        {question.choices.length > 2 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeChoice(qIdx, cIdx)}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addChoice(qIdx)}
                                    className="w-fit"
                                >
                                    <Plus className="mr-1 size-4" />
                                    Add choice
                                </Button>
                            </div>
                        </div>
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={addQuestion}
                        className="w-fit"
                    >
                        <Plus className="mr-1 size-4" />
                        Add question
                    </Button>
                </div>
            )}

            {effectiveQuestionType === 'qr_scan' && (
                <p className="text-sm text-muted-foreground">
                    This stage uses QR scan only — participants scan a QR code to complete it.
                </p>
            )}
        </fieldset>
    );
}
