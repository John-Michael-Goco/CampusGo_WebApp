import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Pencil, Search, User } from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';

type Question = {
    question_text: string;
    question_type: string;
    choices: { choice_text: string; is_correct: boolean }[];
};

type Stage = {
    stage_number: number;
    location_hint: string;
    max_survivors: number | null;
    passing_score: number | null;
    minimum_participants: number | null;
    stage_deadline: string | null;
    questions: Question[];
};

type Participant = {
    id: number;
    current_stage: number;
    status: string;
    user: { id: number; name: string; email: string | null; avatar?: string | null } | null;
};

type Quest = {
    id: number;
    title: string;
    description: string | null;
    quest_type: string;
    question_type: string;
    is_elimination: boolean;
    reward_points: number;
    reward_custom_prize: string | null;
    max_participants: number | null;
    start_date: string | null;
    end_date: string | null;
    status: string;
    approval_status: string;
    creator: { id: number; name: string } | null;
    target_display: string;
    stages: Stage[];
    participants: Participant[];
};

type Props = {
    quest: Quest;
};

function formatDateTime(s: string | null): string {
    if (!s) return '—';
    try {
        const d = new Date(s);
        return d.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '—';
    }
}

function getInitials(name: string | null | undefined): string {
    if (!name || !name.trim()) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
    }
    return name.slice(0, 2).toUpperCase();
}

export default function QuestShowPage({ quest }: Props) {
    const canManageQuests = (usePage().props as { auth?: { canManageQuests?: boolean } }).auth?.canManageQuests ?? false;
    const [participantSearch, setParticipantSearch] = useState('');

    const filteredParticipants = useMemo(() => {
        const list = quest.participants ?? [];
        const q = participantSearch.trim().toLowerCase();
        if (!q) return list;
        return list.filter((p) => {
            const name = p.user?.name?.toLowerCase() ?? '';
            const email = p.user?.email?.toLowerCase() ?? '';
            return name.includes(q) || email.includes(q);
        });
    }, [quest.participants, participantSearch]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Quests', href: '/quests/active' },
        { title: 'Active', href: '/quests/active' },
        { title: quest.title, href: `/quests/${quest.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={quest.title} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/quests/active" aria-label="Back to active quests">
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <h1 className="text-xl font-semibold">{quest.title}</h1>
                        <Badge variant="outline" className="capitalize">
                            {quest.status}
                        </Badge>
                        <Badge variant="secondary" className="capitalize">
                            {quest.approval_status}
                        </Badge>
                    </div>
                    {canManageQuests && (
                        <Button asChild>
                            <Link href={`/quests/${quest.id}/edit`}>
                                <Pencil className="mr-2 size-4" />
                                Edit quest
                            </Link>
                        </Button>
                    )}
                </div>

                <section className="rounded-lg border bg-card p-4">
                    <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">Overview</h2>
                    <dl className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <dt className="text-xs font-medium text-muted-foreground">Description</dt>
                            <dd className="mt-0.5 text-sm">{quest.description || '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-muted-foreground">Quest type</dt>
                            <dd className="mt-0.5 text-sm capitalize">{quest.quest_type}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-muted-foreground">Question type</dt>
                            <dd className="mt-0.5 text-sm capitalize">{quest.question_type?.replace('_', ' ')}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-muted-foreground">Target</dt>
                            <dd className="mt-0.5 text-sm">{quest.target_display}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-muted-foreground">Start date</dt>
                            <dd className="mt-0.5 text-sm">{formatDateTime(quest.start_date)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-muted-foreground">End date</dt>
                            <dd className="mt-0.5 text-sm">{formatDateTime(quest.end_date)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-muted-foreground">Reward (points)</dt>
                            <dd className="mt-0.5 text-sm">{quest.reward_points}</dd>
                        </div>
                        {quest.reward_custom_prize && (
                            <div>
                                <dt className="text-xs font-medium text-muted-foreground">Custom prize</dt>
                                <dd className="mt-0.5 text-sm">{quest.reward_custom_prize}</dd>
                            </div>
                        )}
                        <div>
                            <dt className="text-xs font-medium text-muted-foreground">Max participants</dt>
                            <dd className="mt-0.5 text-sm">
                                {quest.max_participants == null || quest.max_participants === 0
                                    ? 'Unlimited'
                                    : quest.max_participants}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium text-muted-foreground">Elimination</dt>
                            <dd className="mt-0.5 text-sm">{quest.is_elimination ? 'Yes' : 'No'}</dd>
                        </div>
                        {quest.creator && (
                            <div>
                                <dt className="text-xs font-medium text-muted-foreground">Created by</dt>
                                <dd className="mt-0.5 text-sm">{quest.creator.name}</dd>
                            </div>
                        )}
                    </dl>
                </section>

                {quest.participants && quest.participants.length > 0 && (
                    <section className="rounded-lg border bg-card p-4">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                Participants
                            </h2>
                            <div className="relative flex w-full min-w-[200px] max-w-sm flex-1">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search by name or email..."
                                    value={participantSearch}
                                    onChange={(e) => setParticipantSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {filteredParticipants.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    {participantSearch.trim()
                                        ? 'No participants match your search.'
                                        : 'No participants.'}
                                </p>
                            ) : (
                                filteredParticipants.map((p) => (
                                <Tooltip key={p.id}>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            className="flex size-9 shrink-0 overflow-hidden rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground shadow-sm ring-offset-background transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                            aria-label={p.user?.name ?? 'Participant'}
                                        >
                                            {p.user?.avatar ? (
                                                <img
                                                    src={p.user.avatar}
                                                    alt=""
                                                    className="size-full object-cover"
                                                />
                                            ) : p.user?.name ? (
                                                getInitials(p.user.name)
                                            ) : (
                                                <User className="size-4" />
                                            )}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs space-y-2 text-left">
                                        <div className="flex flex-col items-center gap-2">
                                            <Avatar className="size-24 shrink-0 overflow-hidden rounded-full border-2 border-background">
                                                <AvatarImage src={p.user?.avatar ?? undefined} alt={p.user?.name ?? ''} />
                                                <AvatarFallback className="bg-muted text-sm font-medium">
                                                    {p.user?.name ? getInitials(p.user.name) : <User className="size-6" />}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="w-full space-y-0.5">
                                                <p className="font-medium">{p.user?.name ?? 'Unknown'}</p>
                                                <p className="text-muted-foreground text-sm">
                                                    Stage {p.current_stage} of {quest.stages.length}
                                                </p>
                                                <p className="text-muted-foreground text-sm capitalize">{p.status}</p>
                                                {p.user?.email && (
                                                    <p className="truncate text-muted-foreground text-xs">{p.user.email}</p>
                                                )}
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                                ))
                            )}
                        </div>
                    </section>
                )}

                <section className="rounded-lg border bg-card p-4">
                    <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">Stages</h2>
                    <div className="space-y-6">
                        {quest.stages.map((stage) => (
                            <div key={stage.stage_number} className="rounded-md border bg-muted/30 p-4">
                                <h3 className="mb-3 font-medium">Stage {stage.stage_number}</h3>
                                <dl className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
                                    <div>
                                        <dt className="text-xs text-muted-foreground">Location hint</dt>
                                        <dd>{stage.location_hint || '—'}</dd>
                                    </div>
                                    {stage.stage_deadline && (
                                        <div>
                                            <dt className="text-xs text-muted-foreground">Deadline</dt>
                                            <dd>{formatDateTime(stage.stage_deadline)}</dd>
                                        </div>
                                    )}
                                    {quest.is_elimination && stage.max_survivors != null && (
                                        <div>
                                            <dt className="text-xs text-muted-foreground">Max survivors</dt>
                                            <dd>{stage.max_survivors}</dd>
                                        </div>
                                    )}
                                    {quest.is_elimination && stage.minimum_participants != null && (
                                        <div>
                                            <dt className="text-xs text-muted-foreground">Min participants</dt>
                                            <dd>{stage.minimum_participants}</dd>
                                        </div>
                                    )}
                                    {stage.passing_score != null && (
                                        <div>
                                            <dt className="text-xs text-muted-foreground">Passing score</dt>
                                            <dd>{stage.passing_score}</dd>
                                        </div>
                                    )}
                                </dl>
                                <div className="space-y-3">
                                    {stage.questions.map((q, qIdx) => (
                                        <div key={qIdx} className="rounded border bg-background p-3">
                                            <p className="mb-2 font-medium text-sm">{q.question_text}</p>
                                            {q.question_type === 'multiple_choice' && q.choices.length > 0 && (
                                                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                                                    {q.choices.map((c, cIdx) => (
                                                        <li key={cIdx}>
                                                            {c.choice_text}
                                                            {c.is_correct && (
                                                                <span className="ml-1 text-green-600 dark:text-green-400">(correct)</span>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            {q.question_type === 'qr_scan' && (
                                                <p className="text-sm text-muted-foreground">QR scan</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
