import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Award, Check, Lock, Trophy } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export type SimulationAchievement = {
    id: number;
    name: string;
    description: string | null;
    requirement_type: string;
    requirement_value: number;
};

export type SimulationEarnedEntry = {
    id: number;
    earned_at: string | null;
    achievement: SimulationAchievement | null;
};

type Stats = {
    level: number;
    total_completed_quests: number;
    quests_won: number;
};

type Props = {
    stats: Stats;
    earnedAchievements: SimulationEarnedEntry[];
    allAchievements: SimulationAchievement[];
    earnedIds: number[];
    unlockedAchievement?: SimulationAchievement | null;
};

const REQUIREMENT_LABELS: Record<string, string> = {
    quest_count: 'Quest count',
    level: 'Level',
    quest_win: 'Quests win',
};

function requirementLabel(achievement: SimulationAchievement): string {
    const type = REQUIREMENT_LABELS[achievement.requirement_type] ?? achievement.requirement_type;
    return `${type}: ${achievement.requirement_value}`;
}

export default function SimulationAchievements({
    stats,
    earnedAchievements,
    allAchievements,
    earnedIds,
    unlockedAchievement,
}: Props) {
    const [showUnlocked, setShowUnlocked] = useState(!!unlockedAchievement);
    const [simulating, setSimulating] = useState<string | null>(null);

    useEffect(() => {
        if (unlockedAchievement) setShowUnlocked(true);
    }, [unlockedAchievement]);

    const handleSimulate = (action: string, url: string) => {
        setSimulating(action);
        router.post(url, {}, {
            preserveScroll: true,
            onFinish: () => setSimulating(null),
        });
    };

    return (
        <>
            <Head title="Achievements (simulation)" />
            <div className="min-h-svh bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-start p-4 safe-area-padding">
                <div className="w-full max-w-[400px] min-h-[500px] bg-white dark:bg-zinc-800 rounded-[2rem] shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 flex flex-col">
                    <div className="h-10 shrink-0 bg-amber-500 dark:bg-amber-600 flex items-end justify-center pb-2">
                        <div className="w-24 h-1.5 rounded-full bg-black/20 dark:bg-white/20" />
                    </div>

                    <div className="flex-1 overflow-y-auto flex flex-col">
                        <div className="p-4 pb-2 flex flex-col items-center gap-1 border-b border-zinc-200 dark:border-zinc-700">
                            <div className="flex items-center justify-center gap-2">
                                <Award className="size-8 text-amber-600 dark:text-amber-400" />
                                <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                    Achievements
                                </h1>
                            </div>
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                Simulation — simulate progress
                            </p>
                        </div>

                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3">
                                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.level}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">Level</p>
                            </div>
                            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3">
                                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                    {stats.total_completed_quests}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">Quests done</p>
                            </div>
                            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3">
                                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                    {stats.quests_won}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">Quests won</p>
                            </div>
                        </div>

                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
                            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                Simulate progress
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    disabled={!!simulating}
                                    onClick={() => handleSimulate('level', '/simulation/achievements/simulate-level-up')}
                                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                                >
                                    {simulating === 'level' ? '…' : 'Level up'}
                                </button>
                                <button
                                    type="button"
                                    disabled={!!simulating}
                                    onClick={() => handleSimulate('win', '/simulation/achievements/simulate-quest-win')}
                                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                                >
                                    {simulating === 'win' ? '…' : 'Win quest'}
                                </button>
                                <button
                                    type="button"
                                    disabled={!!simulating}
                                    onClick={() =>
                                        handleSimulate('part', '/simulation/achievements/simulate-quest-participation')
                                    }
                                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                                >
                                    {simulating === 'part' ? '…' : 'Quest participation'}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 p-4">
                            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                All achievements
                            </h2>
                            {allAchievements.length === 0 ? (
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4">
                                    No achievements defined yet. Add some in the main app Store &amp; Achievements.
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {allAchievements.map((a) => {
                                        const earned = earnedIds.includes(a.id);
                                        return (
                                            <li
                                                key={a.id}
                                                className={`rounded-xl border p-3 flex items-start gap-3 ${
                                                    earned
                                                        ? 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/30'
                                                        : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80'
                                                }`}
                                            >
                                                <div
                                                    className={`shrink-0 mt-0.5 flex size-8 items-center justify-center rounded-full ${
                                                        earned ? 'bg-amber-500 text-white' : 'bg-zinc-300 dark:bg-zinc-600 text-zinc-500'
                                                    }`}
                                                >
                                                    {earned ? (
                                                        <Check className="size-5" />
                                                    ) : (
                                                        <Lock className="size-4" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                                        {a.name}
                                                    </p>
                                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                        {requirementLabel(a)}
                                                    </p>
                                                    {a.description && (
                                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                                            {a.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex flex-col items-center gap-2 text-center">
                    <Link
                        href="/simulation/store"
                        className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                        Store (simulation)
                    </Link>
                    <Link
                        href="/simulation/quests"
                        className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        Quests (simulation)
                    </Link>
                    <Link
                        href="/simulation/transactions"
                        className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                        My transactions (simulation)
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

            <Dialog open={showUnlocked} onOpenChange={setShowUnlocked}>
                <DialogContent className="max-w-[340px] rounded-2xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/50 dark:border-amber-500">
                    <DialogHeader>
                        <div className="flex justify-center mb-2">
                            <div className="flex size-14 items-center justify-center rounded-full bg-amber-500 text-white">
                                <Trophy className="size-8" />
                            </div>
                        </div>
                        <DialogTitle className="text-center text-xl">
                            Achievement unlocked!
                        </DialogTitle>
                        {unlockedAchievement && (
                            <DialogDescription asChild>
                                <div className="text-center space-y-1 pt-1">
                                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                                        {unlockedAchievement.name}
                                    </p>
                                    {unlockedAchievement.description && (
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                            {unlockedAchievement.description}
                                        </p>
                                    )}
                                </div>
                            </DialogDescription>
                        )}
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </>
    );
}
