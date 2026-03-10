import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export type SimulationStoreItem = {
    id: number;
    name: string;
    description: string | null;
    cost_points: number;
    stock: number;
    start_date: string | null;
    end_date: string | null;
    is_visible: boolean;
};

export type SimulationInventoryEntry = {
    id: number;
    item_id: number;
    quantity: number;
    acquired_at: string;
    store_item?: { id: number; name: string };
};

export type SimulationStudentSearchResult = {
    id: number;
    name: string;
    email: string;
    school_id: string | null;
    first_name: string | null;
    last_name: string | null;
    course: string | null;
    year_level: number | null;
    section: string | null;
    points_balance: number;
};

type Props = {
    storeItems: SimulationStoreItem[];
    pointsBalance: number;
    inventory: SimulationInventoryEntry[];
    canTransferPoints?: boolean;
    flash?: { status?: string };
};

/** True if item is within start_date–end_date range (redeemable). */
function isItemAvailableNow(item: SimulationStoreItem): boolean {
    const now = Date.now();
    if (item.start_date) {
        const start = new Date(item.start_date).getTime();
        if (now < start) return false;
    }
    if (item.end_date) {
        const end = new Date(item.end_date).getTime();
        if (now > end) return false;
    }
    return true;
}

/** Merge inventory entries by item_id so same product stacks in one row. */
function mergeInventory(entries: SimulationInventoryEntry[]): { item_id: number; name: string; quantity: number }[] {
    const byItem = new Map<number, { name: string; quantity: number }>();
    for (const e of entries) {
        const name = e.store_item?.name ?? `Item #${e.item_id}`;
        const existing = byItem.get(e.item_id);
        if (existing) {
            existing.quantity += e.quantity;
        } else {
            byItem.set(e.item_id, { name, quantity: e.quantity });
        }
    }
    return Array.from(byItem.entries()).map(([item_id, { name, quantity }]) => ({
        item_id,
        name,
        quantity,
    }));
}

export default function SimulationStore({
    storeItems,
    pointsBalance,
    inventory,
    canTransferPoints = false,
    flash,
}: Props) {
    const status = flash?.status;
    const [redeemingId, setRedeemingId] = useState<number | null>(null);
    const [usingItemId, setUsingItemId] = useState<number | null>(null);

    const [transferOpen, setTransferOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState<SimulationStudentSearchResult | null | undefined>(undefined);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchMessage, setSearchMessage] = useState<string | null>(null);
    const [transferAmount, setTransferAmount] = useState(10);
    const [transferSubmitting, setTransferSubmitting] = useState(false);

    const mergedInventory = mergeInventory(inventory);

    const handleSearchStudent = async () => {
        const q = searchQuery.trim();
        if (!q) return;
        setSearchLoading(true);
        setSearchResult(undefined);
        setSearchMessage(null);
        try {
            const res = await fetch(
                `/simulation/students/search?student_id=${encodeURIComponent(q)}`,
                { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } }
            );
            const data = (await res.json()) as {
                student: SimulationStudentSearchResult | null;
                message?: string;
            };
            setSearchResult(data.student ?? null);
            setSearchMessage(data.student ? null : (data.message ?? 'Student not found.'));
            if (data.student) setTransferAmount(10);
        } catch {
            setSearchResult(null);
            setSearchMessage('Search failed.');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleTransfer = () => {
        if (!searchResult || transferAmount < 10 || transferAmount > 100) return;
        setTransferSubmitting(true);
        router.post('/simulation/points/transfer', {
            to_user_id: searchResult.id,
            amount: transferAmount,
        }, {
            preserveScroll: true,
            onFinish: () => setTransferSubmitting(false),
            onSuccess: () => {
                setSearchResult(null);
                setSearchQuery('');
                setTransferAmount(10);
            },
        });
    };

    const handleRedeem = (storeItemId: number, quantity: number) => {
        setRedeemingId(storeItemId);
        router.post('/simulation/store/redeem', { store_item_id: storeItemId, quantity }, {
            preserveScroll: true,
            onFinish: () => setRedeemingId(null),
        });
    };

    const handleUse = (storeItemId: number) => {
        setUsingItemId(storeItemId);
        router.post('/simulation/inventory/use', { store_item_id: storeItemId }, {
            preserveScroll: true,
            onFinish: () => setUsingItemId(null),
        });
    };

    return (
        <>
            <Head title="Store (simulation)" />
            <div className="min-h-svh bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-start p-4 safe-area-padding">
                <div className="w-full max-w-[400px] min-h-[500px] bg-white dark:bg-zinc-800 rounded-[2rem] shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 flex flex-col">
                    <div className="h-10 shrink-0 bg-emerald-600 dark:bg-emerald-700 flex items-end justify-center pb-2">
                        <div className="w-24 h-1.5 rounded-full bg-black/20 dark:bg-white/20" />
                    </div>

                    <div className="flex-1 overflow-y-auto flex flex-col">
                        <div className="p-4 pb-2 flex flex-col items-center gap-1 border-b border-zinc-200 dark:border-zinc-700">
                            <img src="/images/logo.png" alt="CampusGo" className="h-12 w-auto" />
                            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                Store
                            </h1>
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                Your points: {pointsBalance} pts
                            </p>
                            {status && (
                                <p className="text-sm text-emerald-600 dark:text-emerald-400">{status}</p>
                            )}
                            <button
                                type="button"
                                onClick={() => router.visit('/simulation/store', { preserveState: false })}
                                className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 underline"
                            >
                                Refresh list
                            </button>

                            {canTransferPoints && (
                                <button
                                    type="button"
                                    onClick={() => setTransferOpen((o) => !o)}
                                    className="mt-2 py-2 px-3 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700"
                                >
                                    {transferOpen ? 'Hide transfer' : 'Transfer points'}
                                </button>
                            )}
                        </div>

                        {canTransferPoints && transferOpen && (
                            <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 space-y-3 bg-zinc-50 dark:bg-zinc-800/50">
                                <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                    Transfer points (10–100)
                                </h2>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchStudent()}
                                        placeholder="Student ID"
                                        className="flex-1 min-w-0 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                                    />
                                    <button
                                        type="button"
                                        disabled={searchLoading}
                                        onClick={handleSearchStudent}
                                        className="shrink-0 rounded-md bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                                    >
                                        {searchLoading ? 'Searching…' : 'Search'}
                                    </button>
                                </div>
                                {searchMessage && (
                                    <p className="text-sm text-amber-600 dark:text-amber-400">{searchMessage}</p>
                                )}
                                {searchResult && (
                                    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 space-y-2 text-sm">
                                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                            {searchResult.name}
                                        </p>
                                        <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-zinc-600 dark:text-zinc-400">
                                            <dt>Student ID:</dt>
                                            <dd>{searchResult.school_id ?? '—'}</dd>
                                            <dt>Email:</dt>
                                            <dd className="truncate">{searchResult.email}</dd>
                                            <dt>Course:</dt>
                                            <dd>{searchResult.course ?? '—'}</dd>
                                            <dt>Year:</dt>
                                            <dd>{searchResult.year_level ?? '—'}</dd>
                                            <dt>Section:</dt>
                                            <dd>{searchResult.section ?? '—'}</dd>
                                            <dt>Their balance:</dt>
                                            <dd>{searchResult.points_balance} pts</dd>
                                        </dl>
                                        <div className="pt-2 flex flex-wrap items-center gap-2">
                                            <label className="text-zinc-700 dark:text-zinc-300">
                                                Amount:
                                                <input
                                                    type="number"
                                                    min={10}
                                                    max={100}
                                                    value={transferAmount}
                                                    onChange={(e) =>
                                                        setTransferAmount(
                                                            Math.min(100, Math.max(10, parseInt(e.target.value, 10) || 10))
                                                        )
                                                    }
                                                    className="ml-2 w-16 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1 text-sm"
                                                />
                                            </label>
                                            <span className="text-zinc-500 dark:text-zinc-400 text-xs">pts (10–100)</span>
                                            <button
                                                type="button"
                                                disabled={
                                                    transferSubmitting ||
                                                    pointsBalance < transferAmount
                                                }
                                                onClick={handleTransfer}
                                                className="rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 disabled:pointer-events-none"
                                            >
                                                {transferSubmitting ? 'Transferring…' : 'Transfer'}
                                            </button>
                                        </div>
                                        {pointsBalance < transferAmount && (
                                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                                Not enough points (you have {pointsBalance}).
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {mergedInventory.length > 0 && (
                            <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
                                <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                    My inventory
                                </h2>
                                <ul className="space-y-2">
                                    {mergedInventory.map((row) => (
                                        <li
                                            key={row.item_id}
                                            className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 px-3 py-2"
                                        >
                                            <span className="text-sm text-zinc-700 dark:text-zinc-300 min-w-0 truncate">
                                                {row.name} × {row.quantity}
                                            </span>
                                            <button
                                                type="button"
                                                disabled={row.quantity <= 0 || usingItemId === row.item_id}
                                                onClick={() => handleUse(row.item_id)}
                                                className="shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50 disabled:pointer-events-none"
                                            >
                                                {usingItemId === row.item_id ? 'Using…' : 'Use'}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex-1 p-4">
                            {storeItems.length === 0 ? (
                                <p className="text-center text-zinc-500 dark:text-zinc-400 py-8 text-sm">
                                    No items in the store yet.
                                </p>
                            ) : (
                                <ul className="space-y-3">
                                    {storeItems.map((item) => {
                                        const availableNow = isItemAvailableNow(item);
                                        const canAfford = pointsBalance >= item.cost_points;
                                        const inStock = item.stock >= 1;
                                        const disabled =
                                            !availableNow || !canAfford || !inStock || redeemingId === item.id;
                                        return (
                                            <li
                                                key={item.id}
                                                className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 p-4"
                                            >
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                                            {item.name}
                                                        </h2>
                                                        {item.description && (
                                                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                                                                {item.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="shrink-0 flex flex-col items-end gap-0.5">
                                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                            {item.cost_points} pts
                                                        </span>
                                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                            Stock: {item.stock}
                                                        </span>
                                                        {!availableNow && (
                                                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                                                Coming soon
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    disabled={disabled}
                                                    onClick={() => handleRedeem(item.id, 1)}
                                                    className="mt-3 w-full py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none"
                                                >
                                                    {redeemingId === item.id
                                                        ? 'Buying…'
                                                        : !availableNow
                                                          ? 'Coming soon'
                                                          : !inStock
                                                            ? 'Out of stock'
                                                            : !canAfford
                                                              ? 'Not enough points'
                                                              : 'Buy (1)'}
                                                </button>
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
                        href="/simulation/achievements"
                        className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
                    >
                        Achievements (simulation)
                    </Link>
                    <Link
                        href="/simulation/student-register"
                        className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                        Student sign up (simulation)
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
