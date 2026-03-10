import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { StageForm } from '../create/StageForm';
import type { StageFormData } from '../create/stages-types';
import { createEmptyStage } from '../create/stages-types';
import type { CreateQuestFormData } from '../create/types';

type Props = {
    questId: number;
    questData: CreateQuestFormData;
    existingStages: StageFormData[];
};

export default function EditQuestStagesPage({ questId, questData, existingStages }: Props) {
    const numStages = typeof questData.num_stages === 'number' ? questData.num_stages : 1;

    const [stages, setStages] = useState<StageFormData[]>(() => {
        if (existingStages && existingStages.length > 0) {
            if (existingStages.length >= numStages) {
                return existingStages.slice(0, numStages);
            }
            return [
                ...existingStages,
                ...Array.from(
                    { length: numStages - existingStages.length },
                    (_, i) => createEmptyStage(existingStages.length + i + 1),
                ),
            ];
        }
        return Array.from({ length: numStages }, (_, i) => createEmptyStage(i + 1));
    });
    const [currentIdx, setCurrentIdx] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Quests', href: '/quests/active' },
        { title: 'Active', href: '/quests/active' },
        { title: 'Edit quest', href: `/quests/${questId}/edit` },
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
        } else {
            router.get(`/quests/${questId}/edit`, { questData: JSON.stringify(questData) });
        }
    };

    const handleNext = () => {
        if (currentIdx < numStages - 1) {
            setCurrentIdx(currentIdx + 1);
        }
    };

    const isLastStage = currentIdx === numStages - 1;

    const handleSubmit = () => {
        setSubmitting(true);
        const finalStages = questData.is_elimination
            ? stages
            : stages.map((s) => ({
                ...s,
                stage_deadline: questData.end_date || '',
                max_survivors: '',
                minimum_participants: '',
            }));
        router.put(`/quests/${questId}`, {
            quest: questData,
            stages: finalStages,
        }, {
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Stage ${currentIdx + 1}`} />
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

                <div className="mx-auto w-full max-w-4xl">
                    <StageForm
                        key={currentIdx}
                        stage={stages[currentIdx]}
                        questType={questData.quest_type}
                        isElimination={questData.is_elimination}
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
                                <Button
                                    type="button"
                                    disabled={submitting}
                                    onClick={handleSubmit}
                                >
                                    {submitting ? 'Saving...' : 'Save changes'}
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
