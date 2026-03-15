import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { addMinutes, format } from 'date-fns';
import { ArrowLeft, BookOpen, Lightbulb } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { QuestFormFields } from './QuestFormFields';
import type { CreateQuestFormData, EnrollmentSemester } from './types';
import { INITIAL_FORM_DATA } from './types';

type PageProps = {
    questId?: number;
    questData?: CreateQuestFormData | null;
    questStatus?: string;
    enrollmentSemester?: EnrollmentSemester;
};

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
        description: "Find the QR code, then answer questions. Pass each stage's quiz to advance. Pass the last stage to win.",
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

function getDefaultStartDate(): string {
    return format(addMinutes(new Date(), 5), "yyyy-MM-dd'T'HH:mm");
}

const QUEST_TYPE_RULES = [
    {
        title: '1. Elimination + QR only',
        items: [
            { label: 'Join', text: 'Scan the first-stage QR to join. One QR per stage.' },
            { label: 'Play', text: 'Go to each stage location and scan that stage\'s QR. No questions, no choices — scanning the correct QR completes the stage.' },
            { label: 'Elimination', text: 'You are eliminated if the stage deadline has passed or max participants has already been hit. Your status becomes eliminated; you cannot continue to the next stage.' },
            { label: 'Winning', text: 'First participant(s) to complete all stages (scan all QRs in order) within the rules win. Eliminated players are out.' },
        ],
    },
    {
        title: '2. Elimination + MCQ (multiple choice)',
        items: [
            { label: 'Join', text: 'Scan the first-stage QR to join. You may need to scan the stage QR to reveal the questions.' },
            { label: 'Play', text: 'At each stage, answer all the multiple-choice questions. Wait for every participant to submit or for the stage to end to know if you are eliminated or proceed/win.' },
            { label: 'Elimination', text: 'Highest score wins; time submitted is the tie breaker.' },
            { label: 'Winning', text: 'First participant(s) to complete all stages with passing scores win. Eliminated players are out.' },
        ],
    },
    {
        title: '3. Non-elimination + QR only',
        items: [
            { label: 'Join', text: 'Scan the first-stage QR to join.' },
            { label: 'Play', text: 'Go to each stage and scan that stage\'s QR. No questions — scanning the correct QR completes the stage.' },
            { label: 'Winning / completion', text: 'Participants who complete all stages (scan all QRs in order) receive rewards. Leaderboard may still rank by completion time.' },
        ],
    },
    {
        title: '4. Non-elimination + MCQ',
        items: [
            { label: 'Join', text: 'Scan the first-stage QR to join.' },
            { label: 'Play', text: 'At each stage, answer all multiple-choice questions. You need to meet the passing score to advance.' },
            { label: 'Removal', text: 'Not meeting the passing score will get you removed from the quest. You cannot retry unless it is a daily quest.' },
            { label: 'Winning / completion', text: 'Participants who pass all stages get completion rewards. Leaderboard may rank by score and/or time.' },
        ],
    },
];

function QuestTypeRulesModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Rules for quest types</DialogTitle>
                </DialogHeader>
                <p className="text-base text-muted-foreground -mt-2">
                    Elimination vs non-elimination and QR-only vs MCQ (multiple choice).
                </p>
                <div className="overflow-y-auto flex-1 min-h-0 pr-2 -mr-2 space-y-6 mt-4">
                    {QUEST_TYPE_RULES.map((section) => (
                        <section key={section.title}>
                            <h3 className="text-base font-semibold text-foreground mb-2">{section.title}</h3>
                            <ul className="space-y-2">
                                {section.items.map((item) => (
                                    <li key={item.label} className="text-base text-muted-foreground leading-relaxed">
                                        <span className="font-medium text-foreground">{item.label}:</span>{' '}
                                        {item.text}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4 pt-3 border-t">
                    These rules align with the API: <code className="bg-muted px-1 rounded">question_type</code> (
                    <code className="bg-muted px-1 rounded">qr_scan</code> / <code className="bg-muted px-1 rounded">multiple_choice</code>) and{' '}
                    <code className="bg-muted px-1 rounded">is_elimination</code> on quest and play responses.
                </p>
            </DialogContent>
        </Dialog>
    );
}

function QuestTemplatesModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-[calc(100%-2rem)] sm:max-w-6xl overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Quest templates &amp; setup guide</DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto flex-1 min-h-0 pr-2 -mr-2">
                    <div className="grid gap-4 sm:grid-cols-2 mt-4">
                        {QUEST_TEMPLATES.map((tpl) => (
                            <div
                                key={tpl.name}
                                className="rounded-lg border bg-muted/30 dark:bg-zinc-900 p-5"
                            >
                                <h3 className="text-base font-semibold">{tpl.name}</h3>
                                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{tpl.description}</p>
                                <ul className="mt-3 space-y-1">
                                    {tpl.settings.map((s, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                                            <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function QuestFormPage() {
    const { questId, questData, questStatus, enrollmentSemester } = usePage<PageProps>().props;
    const auth = (usePage().props as { auth?: { user?: { role?: string } } }).auth;
    const isEdit = typeof questId === 'number';
    const defaultStartDate = useMemo(() => getDefaultStartDate(), []);
    const initialData = useMemo(() => {
        const data = questData
            ? { ...INITIAL_FORM_DATA, ...questData }
            : { ...INITIAL_FORM_DATA, start_date: defaultStartDate };
        if (!isEdit && auth?.user?.role === 'professor' && !['custom', 'event'].includes(data.quest_type)) {
            data.quest_type = 'custom';
        }
        return data;
    }, [questData, isEdit, auth?.user?.role, defaultStartDate]);
    const form = useForm<CreateQuestFormData>(initialData);
    const [rulesModalOpen, setRulesModalOpen] = useState(false);
    const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Quests', href: '/quests/active' },
        { title: 'Active', href: '/quests/active' },
        { title: isEdit ? 'Edit quest' : 'Create quest', href: isEdit ? `/quests/${questId}/edit` : '/quests/create' },
    ];

    const validateStep1 = (): Record<string, string> => {
        const e: Record<string, string> = {};
        if (!form.data.title.trim()) e.title = 'Quest title is required.';
        if (form.data.is_elimination) {
            if (typeof form.data.num_stages !== 'number' || form.data.num_stages < 2) {
                e.num_stages = 'Elimination quests must have at least 2 stages.';
            }
            const maxPart = form.data.max_participants;
            if (maxPart === '' || maxPart === null || maxPart === undefined || (typeof maxPart === 'number' && maxPart < 1)) {
                e.max_participants = 'Max participants is required for elimination quests.';
            }
        } else {
            if (typeof form.data.num_stages !== 'number' || form.data.num_stages < 1) {
                e.num_stages = 'At least 1 stage is required.';
            }
        }
        if (typeof form.data.reward_points !== 'number' || form.data.reward_points < 1) e.reward_points = 'Reward points are required (1–150).';
        const buyIn = form.data.buy_in_points;
        const reward = typeof form.data.reward_points === 'number' ? form.data.reward_points : 0;
        if (typeof buyIn === 'number' && buyIn > 0 && reward > 0 && buyIn >= reward) {
            e.buy_in_points = 'Buy-in must be lower than reward points.';
        }
        if (!form.data.start_date) e.start_date = 'Start date is required.';
        else if (!isEdit && new Date(form.data.start_date).getTime() < Date.now()) e.start_date = 'Start date must be today or in the future.';
        if (!form.data.end_date) e.end_date = 'End date is required.';
        if (form.data.start_date && form.data.end_date) {
            const startMs = new Date(form.data.start_date).getTime();
            const endMs = new Date(form.data.end_date).getTime();
            if (endMs < startMs) e.end_date = 'End date must be on or after start date.';
            else if (endMs - startMs < 60 * 60 * 1000) e.end_date = 'End date must be at least 1 hour after start date.';
        }
        if (form.data.quest_type === 'enrollment' && !enrollmentSemester) e.quest_type = 'No available semester for enrollment quests.';
        if (form.data.create_achievement && !form.data.achievement_name?.trim()) {
            e.achievement_name = 'Achievement name is required when creating an achievement.';
        }
        return e;
    };

    const handleContinue = () => {
        const errs = validateStep1();
        if (Object.keys(errs).length > 0) {
            setClientErrors(errs);
            return;
        }
        setClientErrors({});
        if (isEdit) {
            router.get(`/quests/${questId}/edit/stages`, { questData: JSON.stringify(form.data) });
        } else {
            router.get('/quests/create/stages', { questData: JSON.stringify(form.data) });
        }
    };

    const mergedErrors = { ...form.errors, ...clientErrors };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? 'Edit Quest' : 'Create Quest'} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild>
                            <Link
                                href={isEdit && questId ? `/quests/${questId}` : '/quests/active'}
                                aria-label={isEdit ? 'Back to quest' : 'Back to active quests'}
                            >
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <h1 className="text-xl font-semibold">{isEdit ? 'Edit Quest' : 'Create Quest'}</h1>
                        {!isEdit && (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setTemplatesModalOpen(true)}
                                    className="gap-2"
                                >
                                    <Lightbulb className="size-4" />
                                    Quest templates
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setRulesModalOpen(true)}
                                    className="gap-2"
                                >
                                    <BookOpen className="size-4" />
                                    Quest type rules
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <QuestTypeRulesModal open={rulesModalOpen} onOpenChange={setRulesModalOpen} />
                <QuestTemplatesModal open={templatesModalOpen} onOpenChange={setTemplatesModalOpen} />

                <div className="mx-auto w-full max-w-4xl">
                    <QuestFormFields
                        data={form.data}
                        errors={mergedErrors}
                        setData={form.setData}
                        enrollmentSemester={enrollmentSemester}
                        isEdit={isEdit}
                        isOngoing={questStatus === 'ongoing'}
                    />

                    <div className="mt-8 flex items-center justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href={isEdit && questId ? `/quests/${questId}` : '/quests/active'}>Cancel</Link>
                        </Button>
                        <Button type="button" onClick={handleContinue}>
                            Continue
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
