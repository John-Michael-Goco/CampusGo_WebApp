import { Head, Link } from '@inertiajs/react';
import { Receipt } from 'lucide-react';

export type SimulationTransaction = {
    id: number;
    amount: number;
    transaction_type: string;
    type_label: string;
    created_at: string | null;
};

type Props = {
    transactions: SimulationTransaction[];
};

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function formatTime(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

export default function SimulationTransactions({ transactions }: Props) {
    return (
        <>
            <Head title="My transactions (simulation)" />
            <div className="min-h-svh bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-start p-4 safe-area-padding">
                <div className="w-full max-w-[400px] min-h-[500px] bg-white dark:bg-zinc-800 rounded-[2rem] shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 flex flex-col">
                    <div className="h-10 shrink-0 bg-amber-500 dark:bg-amber-600 flex items-end justify-center pb-2">
                        <div className="w-24 h-1.5 rounded-full bg-black/20 dark:bg-white/20" />
                    </div>

                    <div className="flex-1 overflow-y-auto flex flex-col">
                        <div className="p-4 pb-2 flex flex-col items-center gap-1 border-b border-zinc-200 dark:border-zinc-700">
                            <div className="flex items-center justify-center gap-2">
                                <Receipt className="size-8 text-amber-600 dark:text-amber-400" />
                                <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                    My transactions
                                </h1>
                            </div>
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                Simulation — your point history
                            </p>
                        </div>

                        <div className="p-4 flex-1">
                            {transactions.length === 0 ? (
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
                                    No transactions yet.
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {transactions.map((tx) => (
                                        <li
                                            key={tx.id}
                                            className="flex flex-col gap-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-700/50 px-4 py-3 border border-zinc-200 dark:border-zinc-600"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                    {tx.type_label}
                                                </span>
                                                <span
                                                    className={
                                                        tx.amount >= 0
                                                            ? 'text-sm font-semibold tabular-nums text-green-600 dark:text-green-400'
                                                            : 'text-sm font-semibold tabular-nums text-red-600 dark:text-red-400'
                                                    }
                                                >
                                                    {tx.amount >= 0 ? '+' : ''}
                                                    {tx.amount}
                                                </span>
                                            </div>
                                            <div className="flex gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                                                <span>{formatDate(tx.created_at)}</span>
                                                <span>{formatTime(tx.created_at)}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
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
                            href="/simulation/achievements"
                            className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
                        >
                            Achievements (simulation)
                        </Link>
                        <Link
                            href="/simulation/login"
                            className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline"
                        >
                            Student log in
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
