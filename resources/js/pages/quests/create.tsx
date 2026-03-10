import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronDown, Lightbulb } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { QuestFormFields } from './create/QuestFormFields';
import type { CreateQuestFormData, EnrollmentSemester } from './create/types';
import { INITIAL_FORM_DATA } from './create/types';

type PageProps = {
    questData?: CreateQuestFormData | null;
    enrollmentSemester?: EnrollmentSemester;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Quests', href: '/quests/active' },
    { title: 'Active', href: '/quests/active' },
    { title: 'Create quest', href: '/quests/create' },
];

const QUEST_TEMPLATES = [
    {
        name: 'QR Race',
        description: 'First person to find and scan the QR code wins.',
        settings: [
            'Question type: QR scan only',
            'Stages: 1',
            'Max participants: 1',
            'Not elimination',
        ],
    },
    {
        name: 'QR + Quiz',
        description: 'Find the QR code, then answer questions. Pass each stage\'s quiz to advance. Pass the last stage to win.',
        settings: [
            'Question type: Multiple choice',
            'Stages: 1+',
            'Not elimination',
            'Set a passing score per stage',
        ],
    },
    {
        name: 'Multi-stage Elimination',
        description: 'Participants compete across stages. Only top scorers survive each round.',
        settings: [
            'Question type: Multiple choice or QR scan',
            'Stages: 2+',
            'Enable "Elimination quest"',
            'Set max survivors and deadline per stage',
        ],
    },
    {
        name: 'Scavenger Hunt',
        description: 'Participants scan QR codes at multiple locations. Complete all to win.',
        settings: [
            'Question type: QR scan only',
            'Stages: 2+',
            'Not elimination',
        ],
    },
];

export default function CreateQuestPage() {
    const { questData, enrollmentSemester } = usePage<PageProps>().props;
    const form = useForm<CreateQuestFormData>(questData ?? { ...INITIAL_FORM_DATA });
    const [guideOpen, setGuideOpen] = useState(false);
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    const validateStep1 = (): Record<string, string> => {
        const e: Record<string, string> = {};
        if (!form.data.title.trim()) e.title = 'Quest title is required.';
        if (typeof form.data.num_stages !== 'number' || form.data.num_stages < 1) e.num_stages = 'At least 1 stage is required.';
        if (typeof form.data.reward_points !== 'number' || form.data.reward_points < 1) e.reward_points = 'Reward points are required (1–150).';
        if (!form.data.start_date) e.start_date = 'Start date is required.';
        if (!form.data.end_date) e.end_date = 'End date is required.';
        if (form.data.start_date && form.data.end_date && form.data.start_date > form.data.end_date) e.end_date = 'End date must be on or after start date.';
        if (form.data.quest_type === 'enrollment' && !enrollmentSemester) e.quest_type = 'No available semester for enrollment quests.';
        return e;
    };

    const handleContinue = () => {
        const errs = validateStep1();
        if (Object.keys(errs).length > 0) {
            setClientErrors(errs);
            return;
        }
        setClientErrors({});
        router.get('/quests/create/stages', { questData: JSON.stringify(form.data) });
    };

    const mergedErrors = { ...form.errors, ...clientErrors };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Quest" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h1 className="text-xl font-semibold">Create Quest</h1>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/quests/active">Back to active quests</Link>
                    </Button>
                </div>

                <div className="mx-auto w-full max-w-4xl">
                    <Collapsible open={guideOpen} onOpenChange={setGuideOpen} className="mb-6">
                        <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/50">
                            <Lightbulb className="size-4 shrink-0 text-amber-500" />
                            <span className="flex-1 text-sm font-medium">Quest templates &amp; setup guide</span>
                            <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${guideOpen ? 'rotate-180' : ''}`} />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="mt-2 grid gap-3 sm:grid-cols-2">
                                {QUEST_TEMPLATES.map((tpl) => (
                                    <div
                                        key={tpl.name}
                                        className="rounded-lg border bg-white dark:bg-zinc-900 p-4"
                                    >
                                        <h3 className="text-sm font-semibold">{tpl.name}</h3>
                                        <p className="mt-1 text-xs text-muted-foreground">{tpl.description}</p>
                                        <ul className="mt-2 space-y-0.5">
                                            {tpl.settings.map((s, i) => (
                                                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                                    <span className="mt-1 block size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>

                    <QuestFormFields
                        data={form.data}
                        errors={mergedErrors}
                        setData={form.setData}
                        enrollmentSemester={enrollmentSemester}
                    />

                    <div className="mt-8 flex items-center justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/quests/active">Cancel</Link>
                        </Button>
                        <Button
                            type="button"
                            onClick={handleContinue}
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
