import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Check, Pencil, Printer, Trash2, User, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { DeleteQuestDialog } from './active/DeleteQuestDialog';
import type { QuestShow } from './shared';
import { formatDateTime, getInitials, QuestSearchInput } from './shared';

type Props = {
    quest: QuestShow;
    /** 'history' when opened from Quest History; back link and breadcrumb go to history, and Edit is hidden. */
    from?: string | null;
    /** When from=created, preserve the Created page status filter (pending|approved|rejected|all) for back link. */
    created_status?: string | null;
    /** When from=active, preserve Active list filters for back link. */
    active_search?: string | null;
    active_quest_type?: string | null;
    active_created_by_me?: string | null;
    active_sort_by?: string | null;
    active_sort_dir?: string | null;
    /** When from=history, preserve History list filters for back link. */
    history_search?: string | null;
    history_quest_type?: string | null;
    history_created_by_me?: string | null;
    /** When from=approval, preserve Approval page status filter for back link. */
    approval_status_filter?: string | null;
};

function buildListQuery(params: Record<string, string | undefined | null>): string {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v != null && v !== '') qs.set(k, String(v));
    });
    const s = qs.toString();
    return s ? `?${s}` : '';
}

/** Ordered question IDs (by stage then question order) for matching submissions */
function orderedQuestionIds(quest: QuestShow): number[] {
    const ids: number[] = [];
    for (const stage of quest.stages ?? []) {
        for (const q of stage.questions ?? []) {
            if (q.id != null) ids.push(q.id);
        }
    }
    return ids;
}

const LIST_CONTEXTS = ['active', 'approval', 'history', 'created'] as const;

export default function QuestShowPage({
    quest,
    from,
    created_status,
    active_search,
    active_quest_type,
    active_created_by_me,
    active_sort_by,
    active_sort_dir,
    history_search,
    history_quest_type,
    history_created_by_me,
    approval_status_filter,
}: Props) {
    const canManageQuests = (usePage().props as { auth?: { canManageQuests?: boolean } }).auth?.canManageQuests ?? false;
    const fromHistory = from === 'history';
    const fromApproval = from === 'approval';
    const fromCreated = from === 'created';
    const createdStatusParam = created_status ? `?status=${encodeURIComponent(created_status)}` : '';
    const activeQuery = buildListQuery({
        search: active_search ?? undefined,
        quest_type: active_quest_type ?? undefined,
        created_by_me: active_created_by_me ?? undefined,
        sort_by: active_sort_by ?? undefined,
        sort_dir: active_sort_dir ?? undefined,
    });
    const historyQuery = buildListQuery({
        search: history_search ?? undefined,
        quest_type: history_quest_type ?? undefined,
        created_by_me: history_created_by_me ?? undefined,
    });
    const approvalQuery = approval_status_filter ? `?status=${encodeURIComponent(approval_status_filter)}` : '';
    const backHref = fromApproval
        ? `/quests/approval${approvalQuery}`
        : fromCreated
          ? `/quests/created${createdStatusParam}`
          : fromHistory
            ? `/quests/history${historyQuery}`
            : `/quests/active${activeQuery}`;
    const backLabel = fromApproval ? 'Back to approval' : fromCreated ? 'Back to my quests' : fromHistory ? 'Back to quest history' : 'Back to active quests';
    /** Show stage QR codes when viewing from Active, Approval, History, or Created (same back logic contexts). */
    const showQrs = canManageQuests || (from != null && LIST_CONTEXTS.includes(from as (typeof LIST_CONTEXTS)[number]));
    const [participantSearch, setParticipantSearch] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

    const questionIdOrder = useMemo(() => orderedQuestionIds(quest), [quest]);
    const isMultipleChoice = (quest.question_type ?? '') === 'multiple_choice';
    const totalQuestions = questionIdOrder.length;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Quests', href: '/quests/active' },
        { title: fromApproval ? 'Approval' : fromCreated ? 'My quests' : fromHistory ? 'History' : 'Active', href: backHref },
        { title: quest.title, href: `/quests/${quest.id}` },
    ];

    const isPendingApproval = (quest.approval_status ?? '') === 'pending';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={quest.title} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={backHref} aria-label={backLabel}>
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
                        <div className="flex items-center gap-2">
                            {fromApproval && isPendingApproval && (
                                <>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => router.put(`/quests/${quest.id}/approve`, { approval_status: 'approved' }, { onSuccess: () => router.visit(`/quests/approval${approvalQuery}`) })}
                                    >
                                        <Check className="mr-2 size-4" />
                                        Approve
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => router.put(`/quests/${quest.id}/approve`, { approval_status: 'rejected' }, { onSuccess: () => router.visit(`/quests/approval${approvalQuery}`) })}
                                    >
                                        <X className="mr-2 size-4" />
                                        Reject
                                    </Button>
                                </>
                            )}
                            {!fromApproval && (
                                <>
                                    <Button variant="outline" asChild>
                                        <Link
                                            href={(() => {
                                                const list = fromApproval ? 'approval' : fromCreated ? 'created' : fromHistory ? 'history' : 'active';
                                                const q = new URLSearchParams({ from: 'quest', list });
                                                if (list === 'active') {
                                                    if (active_search) q.set('active_search', active_search);
                                                    if (active_quest_type) q.set('active_quest_type', active_quest_type);
                                                    if (active_created_by_me) q.set('active_created_by_me', active_created_by_me);
                                                    if (active_sort_by) q.set('active_sort_by', active_sort_by);
                                                    if (active_sort_dir) q.set('active_sort_dir', active_sort_dir);
                                                } else if (list === 'history') {
                                                    if (history_search) q.set('history_search', history_search);
                                                    if (history_quest_type) q.set('history_quest_type', history_quest_type);
                                                    if (history_created_by_me) q.set('history_created_by_me', history_created_by_me);
                                                } else if (list === 'created' && created_status) {
                                                    q.set('created_status', created_status);
                                                } else if (list === 'approval' && approval_status_filter) {
                                                    q.set('approval_status_filter', approval_status_filter);
                                                }
                                                return `/quests/${quest.id}/print-qr?${q.toString()}`;
                                            })()}
                                        >
                                            <Printer className="mr-2 size-4" />
                                            Print QR codes
                                        </Link>
                                    </Button>
                                    {!fromHistory && (
                                        <Button asChild>
                                            <Link href={`/quests/${quest.id}/edit`}>
                                                <Pencil className="mr-2 size-4" />
                                                Edit quest
                                            </Link>
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => setShowDeleteDialog(true)}
                                    >
                                        <Trash2 className="mr-2 size-4" />
                                        Delete
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                    {!canManageQuests && fromCreated && quest.approval_status === 'approved' && (
                        <Button variant="outline" asChild>
                            <Link href={`/quests/${quest.id}/print-qr?from=created${created_status ? `&created_status=${encodeURIComponent(created_status)}` : ''}`}>
                                <Printer className="mr-2 size-4" />
                                Print QR codes
                            </Link>
                        </Button>
                    )}
                </div>

                {canManageQuests && (
                    <DeleteQuestDialog
                        quest={quest}
                        open={showDeleteDialog}
                        onOpenChange={setShowDeleteDialog}
                        onConfirm={() => {
                            router.delete(`/quests/${quest.id}`, {
                                onSuccess: () => setShowDeleteDialog(false),
                            });
                        }}
                    />
                )}

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
                            <div className="w-full min-w-[200px] max-w-sm flex-1">
                                <QuestSearchInput
                                    value={participantSearch}
                                    onChange={setParticipantSearch}
                                    placeholder="Search by name or email..."
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
                        {isMultipleChoice && totalQuestions > 0 && filteredParticipants.some((p) => p.submissions && p.submissions.length > 0) && (
                            <div className="mt-6">
                                <h3 className="mb-3 text-sm font-medium">Participant results (multiple choice)</h3>
                                <div className="overflow-hidden rounded-md border">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="h-10 px-4 text-left font-medium">Participant</th>
                                                <th className="h-10 px-4 text-left font-medium">Score</th>
                                                <th className="px-4 py-2 text-left font-medium">Answers</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredParticipants.map((p) => {
                                                const byId = (p.submissions ?? []).reduce<Record<number, boolean>>((acc, s) => {
                                                    acc[s.question_id] = s.is_correct;
                                                    return acc;
                                                }, {});
                                                const correct = questionIdOrder.filter((id) => byId[id] === true).length;
                                                const breakdown = questionIdOrder.map((id) => byId[id]);
                                                return (
                                                    <tr key={p.id} className="border-b transition-colors hover:bg-muted/30">
                                                        <td className="px-4 py-3">
                                                            <span className="font-medium">{p.user?.name ?? 'Unknown'}</span>
                                                            {p.user?.email && (
                                                                <span className="block text-muted-foreground text-xs">{p.user.email}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {correct} / {totalQuestions}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="flex flex-wrap items-center gap-1">
                                                                {breakdown.map((correct_, idx) =>
                                                                    correct_ === true ? (
                                                                        <Tooltip key={idx}>
                                                                            <TooltipTrigger asChild>
                                                                                <span className="inline-flex text-green-600 dark:text-green-400" aria-label="Correct">
                                                                                    <Check className="size-4" />
                                                                                </span>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>Question {idx + 1}: correct</TooltipContent>
                                                                        </Tooltip>
                                                                    ) : correct_ === false ? (
                                                                        <Tooltip key={idx}>
                                                                            <TooltipTrigger asChild>
                                                                                <span className="inline-flex text-destructive" aria-label="Incorrect">
                                                                                    <X className="size-4" />
                                                                                </span>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>Question {idx + 1}: incorrect</TooltipContent>
                                                                        </Tooltip>
                                                                    ) : (
                                                                        <span key={idx} className="inline-flex size-4 items-center justify-center text-muted-foreground" aria-label="No answer">—</span>
                                                                    )
                                                                )}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                <section className="rounded-lg border bg-card p-4">
                    <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">Stages</h2>
                    <div className="space-y-6">
                        {quest.stages.map((stage) => (
                            <div key={stage.id ?? stage.stage_number} className="rounded-md border bg-muted/30 p-4">
                                <h3 className="mb-3 font-medium">Stage {stage.stage_number}</h3>
                                <div className={showQrs ? 'grid gap-4 sm:grid-cols-3' : ''}>
                                    <div className={showQrs ? 'sm:col-span-2 space-y-4' : 'space-y-4'}>
                                        <dl className="grid gap-2 text-sm sm:grid-cols-2">
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
                                    {showQrs && stage.id != null && (
                                        <div className="flex flex-col items-center justify-start gap-2 rounded border border-border/60 bg-background/50 p-4">
                                            <dt className="text-xs font-medium text-muted-foreground">QR (Stage {stage.stage_number})</dt>
                                            <QRCodeSVG
                                                value={typeof window !== 'undefined' ? `${window.location.origin}/quests/${quest.id}/stages/${stage.id}` : `stage:${stage.id}`}
                                                size={200}
                                                level="M"
                                                includeMargin
                                                className="rounded"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
