import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { StageForm } from './StageForm';
import type { StageFormData } from './stages-types';
import { createEmptyStage } from './stages-types';
import type { CreateQuestFormData } from './types';

type Props = {
    questId?: number;
    questData: CreateQuestFormData;
    existingStages?: StageFormData[];
};

export default function QuestStagesPage({ questId, questData: rawQuestData, existingStages = [] }: Props) {
    const questData: CreateQuestFormData = {
        ...rawQuestData,
        question_type: rawQuestData.question_type ?? (rawQuestData.quest_type === 'enrollment' ? 'qr_scan' : 'multiple_choice'),
    };
    const numStages = typeof questData.num_stages === 'number' ? questData.num_stages : 1;
    const effectiveQuestionType = questData.question_type ?? (questData.quest_type === 'enrollment' ? 'qr_scan' : 'multiple_choice');
    const isEdit = typeof questId === 'number';

    const makeStage = (n: number): StageFormData => {
        const stage = createEmptyStage(n);
        stage.question_type = effectiveQuestionType;
        if (effectiveQuestionType === 'qr_scan') {
            stage.questions = [];
        }
        return stage;
    };

    const [stages, setStages] = useState<StageFormData[]>(() => {
        if (isEdit && existingStages && existingStages.length > 0) {
            if (existingStages.length >= numStages) {
                return existingStages.slice(0, numStages);
            }
            return [
                ...existingStages,
                ...Array.from(
                    { length: numStages - existingStages.length },
                    (_, i) => makeStage(existingStages.length + i + 1),
                ),
            ];
        }
        return Array.from({ length: numStages }, (_, i) => makeStage(i + 1));
    });
    const [currentIdx, setCurrentIdx] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [clientErrors, setClientErrors] = useState<string[]>([]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Quests', href: '/quests/active' },
        { title: 'Active', href: '/quests/active' },
        { title: isEdit ? 'Edit quest' : 'Create quest', href: isEdit ? `/quests/${questId}/edit` : '/quests/create' },
        { title: `Stage ${currentIdx + 1} of ${numStages}`, href: '#' },
    ];

    const updateStage = (stage: StageFormData) => {
        setStages((prev) => {
            const next = [...prev];
            next[currentIdx] = stage;
            return next;
        });
    };

    const handleBack = () => {
        if (currentIdx > 0) {
            setCurrentIdx(currentIdx - 1);
        } else if (isEdit && questId) {
            router.get(`/quests/${questId}/edit`, { questData: JSON.stringify(questData) });
        } else {
            router.get('/quests/create', { questData: JSON.stringify(questData) });
        }
    };

    const handleNext = () => {
        if (currentIdx < numStages - 1) {
            setCurrentIdx(currentIdx + 1);
        }
    };

    const isLastStage = currentIdx === numStages - 1;

    const validateStages = (): string[] => {
        const errs: string[] = [];
        const questMax = typeof questData.max_participants === 'number' ? questData.max_participants : 0;
        stages.forEach((s, i) => {
            const label = `Stage ${i + 1}`;
            if (!s.location_hint.trim()) errs.push(`${label}: Location hint is required.`);
            if (questData.is_elimination) {
                if (!s.max_survivors || s.max_survivors < 1) errs.push(`${label}: Max survivors is required.`);
                if (i === 0 && questMax > 0 && (typeof s.max_survivors !== 'number' || s.max_survivors > questMax)) {
                    errs.push(`${label}: Max survivors cannot exceed quest max participants (${questMax}).`);
                }
                if (!s.minimum_participants || s.minimum_participants < 1) errs.push(`${label}: Minimum participants is required.`);
                if (typeof s.max_survivors === 'number' && typeof s.minimum_participants === 'number' && s.minimum_participants > s.max_survivors) {
                    errs.push(`${label}: Min participants cannot exceed max survivors (${s.max_survivors}).`);
                }
                if (!s.stage_deadline) errs.push(`${label}: Stage deadline is required.`);
                if (s.stage_deadline && questData.start_date) {
                    const deadlineTime = new Date(s.stage_deadline).getTime();
                    const startTime = new Date(questData.start_date).getTime();
                    if (!Number.isNaN(deadlineTime) && !Number.isNaN(startTime) && deadlineTime < startTime) {
                        errs.push(`${label}: Stage deadline must be on or after the quest start date.`);
                    }
                }
                if (s.stage_deadline && questData.end_date) {
                    const deadlineTime = new Date(s.stage_deadline).getTime();
                    const endTime = new Date(questData.end_date).getTime();
                    if (!Number.isNaN(deadlineTime) && !Number.isNaN(endTime) && deadlineTime > endTime) {
                        errs.push(`${label}: Stage deadline must be on or before the quest end date.`);
                    }
                }
            }
            if (effectiveQuestionType === 'multiple_choice') {
                if (!s.questions || s.questions.length === 0) {
                    errs.push(`${label}: At least one question is required.`);
                } else {
                    s.questions.forEach((q, qi) => {
                        if (!q.question_text.trim()) errs.push(`${label}, Q${qi + 1}: Question text is required.`);
                        if (!q.choices || q.choices.length < 2) {
                            errs.push(`${label}, Q${qi + 1}: At least 2 choices are required.`);
                        } else {
                            q.choices.forEach((c, ci) => {
                                if (!c.choice_text.trim()) errs.push(`${label}, Q${qi + 1}, Choice ${ci + 1}: Choice text is required.`);
                            });
                            if (!q.choices.some((c) => c.is_correct)) {
                                errs.push(`${label}, Q${qi + 1}: Select a correct answer.`);
                            }
                        }
                    });
                }
            }
        });
        return errs;
    };

    const handleSubmit = () => {
        const errs = validateStages();
        if (errs.length > 0) {
            setClientErrors(errs);
            return;
        }
        setClientErrors([]);
        setSubmitting(true);
        const finalStages = questData.is_elimination
            ? stages
            : stages.map((s) => ({
                ...s,
                stage_deadline: questData.end_date || '',
                max_survivors: '',
                minimum_participants: '',
            }));
        if (isEdit && questId) {
            router.put(`/quests/${questId}`, { quest: questData, stages: finalStages }, { onFinish: () => setSubmitting(false) });
        } else {
            router.post('/quests', { quest: questData, stages: finalStages }, { onFinish: () => setSubmitting(false) });
        }
    };

    const page = usePage();
    const serverErrors = (page.props as { errors?: Record<string, string> }).errors ?? {};
    const allErrors: string[] = [...clientErrors, ...Object.values(serverErrors)];
    const hasErrors = allErrors.length > 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Quest Stage ${currentIdx + 1}`} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h1 className="text-xl font-semibold">
                        Stage {currentIdx + 1}
                        {numStages > 1 && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                of {numStages}
                            </span>
                        )}
                    </h1>
                    <Button variant="outline" size="sm" onClick={handleBack}>
                        {currentIdx > 0 ? 'Previous stage' : 'Back to quest details'}
                    </Button>
                </div>

                {hasErrors && (
                    <div className="mx-auto w-full max-w-4xl rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                        <p className="text-sm font-medium text-destructive mb-1">Please fix the following errors:</p>
                        <ul className="list-disc pl-5 text-sm text-destructive space-y-0.5">
                            {allErrors.map((msg: string, i: number) => (
                                <li key={i}>{msg}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="mx-auto w-full max-w-4xl">
                    <StageForm
                        key={currentIdx}
                        stage={stages[currentIdx]}
                        questType={questData.quest_type}
                        questionType={effectiveQuestionType}
                        isElimination={questData.is_elimination}
                        questMaxParticipants={questData.max_participants}
                        questStartDate={questData.start_date}
                        questEndDate={questData.end_date}
                        onChange={updateStage}
                    />

                    <div className="mt-8 flex items-center justify-between">
                        <div className="flex gap-1">
                            {numStages > 1 &&
                                Array.from({ length: numStages }, (_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setCurrentIdx(i)}
                                        className={`size-2.5 rounded-full transition-colors ${
                                            i === currentIdx
                                                ? 'bg-primary'
                                                : i < currentIdx
                                                  ? 'bg-primary/40'
                                                  : 'bg-muted-foreground/30'
                                        }`}
                                    />
                                ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={handleBack}>
                                {currentIdx > 0 ? 'Previous' : 'Back'}
                            </Button>
                            {isLastStage ? (
                                <Button type="button" disabled={submitting} onClick={handleSubmit}>
                                    {submitting ? (isEdit ? 'Saving...' : 'Submitting...') : (isEdit ? 'Save changes' : 'Submit quest')}
                                </Button>
                            ) : (
                                <Button type="button" onClick={handleNext}>
                                    Next stage
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
