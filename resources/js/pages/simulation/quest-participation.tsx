import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    Swords, Play, Trophy, XCircle, Clock, CheckCircle2,
    Zap, Shield, Users, MapPin, ChevronDown, Calendar,
} from 'lucide-react';

type Participation = {
    id: number;
    quest_id: number;
    quest_title: string;
    quest_type: 'daily' | 'event' | 'custom' | 'enrollment';
    question_type: 'multiple_choice' | 'qr_scan';
    quest_status: string;
    current_stage: number;
    status: 'active' | 'eliminated' | 'quit' | 'winner' | 'awaiting_ranking';
    joined_at: string;
    total_stages: number;
};

type AvailableQuest = {
    id: number;
    title: string;
    description: string | null;
    quest_type: 'daily' | 'event' | 'custom' | 'enrollment';
    question_type: 'multiple_choice' | 'qr_scan';
    is_elimination: boolean;
    reward_points: number;
    reward_custom_prize: string | null;
    buy_in_points: number;
    max_participants: number;
    current_participants: number;
    stages_count: number;
    status: string;
    start_date: string | null;
    end_date: string | null;
    first_stage_id: number | null;
    first_stage_location_hint: string | null;
};

type Props = {
    participations: Participation[];
    availableQuests: AvailableQuest[];
    pointsBalance: number;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Trophy }> = {
    active: { label: 'Active', color: 'text-emerald-600 dark:text-emerald-400', icon: Play },
    awaiting_ranking: { label: 'Awaiting Results', color: 'text-yellow-600 dark:text-yellow-400', icon: Clock },
    eliminated: { label: 'Eliminated', color: 'text-red-500 dark:text-red-400', icon: XCircle },
    quit: { label: 'Quit', color: 'text-zinc-500 dark:text-zinc-400', icon: Clock },
    winner: { label: 'Winner', color: 'text-amber-500 dark:text-amber-400', icon: Trophy },
};

function formatDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function QuestDetail({ quest }: { quest: AvailableQuest }) {
    const { errors } = usePage<{ errors: Record<string, string> }>();
    const [stageId, setStageId] = useState('');
    const [joining, setJoining] = useState(false);

    const handleJoin = () => {
        if (!stageId.trim()) return;
        setJoining(true);
        router.post('/simulation/quests/join', {
            quest_id: quest.id,
            stage_id: parseInt(stageId, 10),
        }, {
            preserveScroll: true,
            onFinish: () => setJoining(false),
        });
    };

    return (
        <div className="mt-3 space-y-3 border-t border-zinc-200 dark:border-zinc-700 pt-3">
            {/* Full details */}
            <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
                {quest.description && (
                    <p>{quest.description}</p>
                )}

                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <span className="text-zinc-500 dark:text-zinc-400">Question type</span>
                    <span className="font-medium">{quest.question_type === 'qr_scan' ? 'QR scan' : 'Multiple choice'}</span>

                    <span className="text-zinc-500 dark:text-zinc-400">Stages</span>
                    <span className="font-medium">{quest.stages_count}</span>

                    <span className="text-zinc-500 dark:text-zinc-400">Reward</span>
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                        {quest.reward_points} pts
                        {quest.reward_custom_prize && ` + ${quest.reward_custom_prize}`}
                    </span>

                    {quest.is_elimination && (
                        <>
                            <span className="text-zinc-500 dark:text-zinc-400">Mode</span>
                            <span className="font-medium text-red-500 dark:text-red-400">Elimination</span>
                        </>
                    )}

                    {quest.buy_in_points > 0 && (
                        <>
                            <span className="text-zinc-500 dark:text-zinc-400">Buy-in</span>
                            <span className="font-medium">{quest.buy_in_points} pts</span>
                        </>
                    )}

                    <>
                        <span className="text-zinc-500 dark:text-zinc-400">Participants</span>
                        <span className="font-medium">
                            {quest.current_participants} / {quest.max_participants > 0 ? quest.max_participants : 'Unlimited'}
                        </span>
                    </>

                    <span className="text-zinc-500 dark:text-zinc-400">Starts</span>
                    <span className="font-medium">{formatDate(quest.start_date)}</span>

                    <span className="text-zinc-500 dark:text-zinc-400">Ends</span>
                    <span className="font-medium">{formatDate(quest.end_date)}</span>
                </div>
            </div>

            {/* Stage 1 location hint */}
            {quest.first_stage_location_hint && (
                <div className="flex items-start gap-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 px-3 py-2">
                    <MapPin className="size-4 shrink-0 text-indigo-500 mt-0.5" />
                    <div>
                        <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                            Stage 1 — Go to this location:
                        </p>
                        <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-0.5">
                            {quest.first_stage_location_hint}
                        </p>
                    </div>
                </div>
            )}

            {/* Stage ID input (simulates QR scan) */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    Enter the Stage ID found at the location
                </label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={stageId}
                        onChange={(e) => setStageId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                        placeholder="Stage ID"
                        min={1}
                        className="flex-1 min-w-0 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                    />
                    <button
                        type="button"
                        disabled={joining || !stageId.trim()}
                        onClick={handleJoin}
                        className="shrink-0 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {joining ? 'Joining…' : 'Join'}
                    </button>
                </div>
                {errors?.stage_id && (
                    <p className="text-xs text-red-500 dark:text-red-400">{errors.stage_id}</p>
                )}
            </div>
        </div>
    );
}

export default function QuestParticipation({ participations, availableQuests, pointsBalance }: Props) {
    const { errors, props } = usePage<{ errors: Record<string, string>; props: { flash?: { status?: string } } }>();
    const flash = (props as any).flash as { status?: string } | undefined;
    const status = flash?.status;

    const [expandedId, setExpandedId] = useState<number | null>(null);

    const toggleExpand = (id: number) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    return (
        <>
            <Head title="Quests (simulation)" />
            <div className="min-h-svh bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-start p-4 safe-area-padding">
                <div className="w-full max-w-[400px] min-h-[500px] bg-white dark:bg-zinc-800 rounded-[2rem] shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 flex flex-col">
                    {/* Status bar */}
                    <div className="h-10 shrink-0 bg-indigo-600 dark:bg-indigo-700 flex items-end justify-center pb-2">
                        <div className="w-24 h-1.5 rounded-full bg-black/20 dark:bg-white/20" />
                    </div>

                    <div className="flex-1 overflow-y-auto flex flex-col">
                        {/* Header */}
                        <div className="p-4 pb-2 flex flex-col items-center gap-1 border-b border-zinc-200 dark:border-zinc-700">
                            <div className="flex items-center justify-center gap-2">
                                <Swords className="size-8 text-indigo-600 dark:text-indigo-400" />
                                <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                    Quest Participation
                                </h1>
                            </div>
                            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                Your points: {pointsBalance} pts
                            </p>
                        </div>

                        {/* Flash messages */}
                        {status && (
                            <div className="mx-4 mt-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2">
                                <p className="text-sm text-emerald-700 dark:text-emerald-300">{status}</p>
                            </div>
                        )}

                        {/* Global errors (not field-specific) */}
                        {errors?.quest_id && (
                            <div className="mx-4 mt-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2">
                                <p className="text-sm text-red-700 dark:text-red-300">{errors.quest_id}</p>
                            </div>
                        )}

                        {/* Available Quests */}
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
                            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
                                Available quests ({availableQuests.length})
                            </h2>

                            {availableQuests.length === 0 ? (
                                <p className="text-center text-zinc-500 dark:text-zinc-400 py-4 text-sm">
                                    No available quests right now.
                                </p>
                            ) : (
                                <ul className="space-y-3">
                                    {availableQuests.map((q) => {
                                        const isExpanded = expandedId === q.id;
                                        return (
                                            <li
                                                key={q.id}
                                                className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-4"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate text-sm">
                                                            {q.title}
                                                        </h3>
                                                        {!isExpanded && q.description && (
                                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                                                                {q.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className="shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:text-indigo-300 uppercase">
                                                        {q.quest_type}
                                                    </span>
                                                </div>

                                                {!isExpanded && (
                                                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                                                        <span className="flex items-center gap-1">
                                                            <Zap className="size-3" />
                                                            {q.reward_points} pts
                                                        </span>
                                                        <span>{q.stages_count} stage{q.stages_count !== 1 ? 's' : ''}</span>
                                                        <span>{q.question_type === 'qr_scan' ? 'QR scan' : 'MC'}</span>
                                                        {q.is_elimination && (
                                                            <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
                                                                <Shield className="size-3" />
                                                                Elim.
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => toggleExpand(q.id)}
                                                    className="mt-2 w-full flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                                                >
                                                    {isExpanded ? 'Hide Details' : 'View Quest'}
                                                    <ChevronDown className={`size-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                </button>

                                                {isExpanded && <QuestDetail quest={q} />}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        {/* My Participations */}
                        <div className="flex-1 p-4">
                            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
                                My quests ({participations.length})
                            </h2>

                            {participations.length === 0 ? (
                                <p className="text-center text-zinc-500 dark:text-zinc-400 py-8 text-sm">
                                    You haven't joined any quests yet.
                                </p>
                            ) : (
                                <ul className="space-y-3">
                                    {participations.map((p) => {
                                        const config = STATUS_CONFIG[p.status] || STATUS_CONFIG.active;
                                        const Icon = config.icon;

                                        return (
                                            <li
                                                key={p.id}
                                                className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 p-4"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                                            {p.quest_title}
                                                        </h3>
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                            Quest #{p.quest_id}
                                                        </p>
                                                    </div>
                                                    <div className={`shrink-0 flex items-center gap-1 ${config.color}`}>
                                                        <Icon className="size-4" />
                                                        <span className="text-xs font-medium">{config.label}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                                                    <span>Stage {p.current_stage}/{p.total_stages}</span>
                                                    <span>Quest: {p.quest_status}</span>
                                                </div>

                                                {p.status === 'active' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => router.get(`/simulation/quests/${p.id}/play`)}
                                                        className="mt-3 w-full py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
                                                    >
                                                        Play / Answer Questions
                                                    </button>
                                                )}

                                                {p.status === 'winner' && (
                                                    <div className="mt-3 flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                                                        <Trophy className="size-4 text-amber-500" />
                                                        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                                                            Quest Completed!
                                                        </span>
                                                    </div>
                                                )}

                                                {p.status === 'eliminated' && (
                                                    <div className="mt-3 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                                                        <XCircle className="size-4 text-red-500" />
                                                        <span className="text-sm font-medium text-red-700 dark:text-red-300">
                                                            Eliminated
                                                        </span>
                                                    </div>
                                                )}

                                                {p.status === 'awaiting_ranking' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => router.get(`/simulation/quests/${p.id}/play`)}
                                                        className="mt-3 w-full py-2 rounded-lg text-sm font-medium bg-yellow-500 text-white hover:bg-yellow-600"
                                                    >
                                                        View / Refresh Results
                                                    </button>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation links */}
                <div className="mt-4 flex flex-col items-center gap-2 text-center">
                    <Link
                        href="/simulation/store"
                        className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                        Store (simulation)
                    </Link>
                    <Link
                        href="/simulation/achievements"
                        className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
                    >
                        Achievements (simulation)
                    </Link>
                    <Link
                        href="/simulation/profile"
                        className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
                    >
                        My profile (simulation)
                    </Link>
                    <Link
                        href="/simulation/leaderboard"
                        className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
                    >
                        Leaderboard (simulation)
                    </Link>
                    <Link
                        href="/simulation/login"
                        className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline"
                    >
                        Student log in
                    </Link>
                </div>
            </div>
        </>
    );
}
