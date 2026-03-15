import { Head, Link, router, usePage } from '@inertiajs/react';
import { Check, Eye, Pencil, Plus, Printer, Trash2, X, XCircle } from 'lucide-react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableScroll,
    TableElement,
    tableHeadClass,
    tableCellClass,
    tableEmptyClass,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { CreatedQuest, PaginatedQuests } from './shared';
import {
    QuestSearchInput,
    QuestPagination,
    formatQuestDate,
    approvalStatusLabel,
    approvalStatusVariant,
} from './shared';

/** Play a short notification sound when quest approval/rejection is detected */
function playApprovalUpdateSound(): void {
    try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const playTone = (frequency: number, startTime: number, duration: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = frequency;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.12, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            osc.start(startTime);
            osc.stop(startTime + duration);
        };
        const play = () => {
            playTone(659.25, 0, 0.2);
            playTone(523.25, 0.22, 0.25);
        };
        if (ctx.state === 'suspended') ctx.resume().then(play).catch(() => {});
        else play();
    } catch {
        // ignore
    }
}

type StatusUpdateItem = { id: number; title: string; approval_status: 'approved' | 'rejected' };

// Module-level store so notification state survives Inertia page re-renders
let _statusUpdates: StatusUpdateItem[] = [];
let _updatesDismissed = false;
const _updateListeners = new Set<() => void>();

function notifyUpdateListeners() {
    _updateListeners.forEach((fn) => fn());
}

function getUpdateSnapshot() {
    return { updates: _statusUpdates, dismissed: _updatesDismissed };
}

let _updateSnapshotRef = getUpdateSnapshot();

function getStableUpdateSnapshot() {
    const next = getUpdateSnapshot();
    if (next.updates !== _updateSnapshotRef.updates || next.dismissed !== _updateSnapshotRef.dismissed) {
        _updateSnapshotRef = next;
    }
    return _updateSnapshotRef;
}

function subscribeUpdates(listener: () => void) {
    _updateListeners.add(listener);
    return () => _updateListeners.delete(listener);
}

function addStatusUpdate(item: StatusUpdateItem) {
    const byId = new Map(_statusUpdates.map((u) => [u.id, u]));
    byId.set(item.id, item);
    _statusUpdates = Array.from(byId.values());
    _updatesDismissed = false;
    notifyUpdateListeners();
}

function dismissUpdates() {
    _updatesDismissed = true;
    notifyUpdateListeners();
}

let _professorEchoSetup = false;

const createdQuestsHeaderRowClass =
    'border-b border-amber-200/60 bg-gradient-to-r from-amber-50/90 to-amber-50/50 dark:border-amber-900/50 dark:from-amber-950/40 dark:to-amber-950/20 text-foreground';
const createdQuestsBodyRowClass =
    'border-b border-border/60 transition-colors hover:bg-amber-50/40 dark:hover:bg-amber-950/20 last:border-b-0';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

type Props = {
    quests: PaginatedQuests<CreatedQuest>;
    filters?: { search?: string; status?: string };
};

function getBreadcrumbs(isAdmin: boolean): BreadcrumbItem[] {
    return [
        { title: 'Quests', href: '/quests/active' },
        { title: isAdmin ? 'Created Quests' : 'Approval', href: '/quests/created' },
    ];
}

export default function CreatedQuestsPage({ quests, filters = {} }: Props) {
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [cancelConfirmQuest, setCancelConfirmQuest] = useState<CreatedQuest | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>(
        (filters.status as StatusFilter) || 'pending'
    );
    const updateStore = useSyncExternalStore(subscribeUpdates, getStableUpdateSnapshot);
    const statusUpdates = updateStore.updates;
    const updatesDismissed = updateStore.dismissed;
    const [updatesCardVisible, setUpdatesCardVisible] = useState(false);
    const isInitialMount = useRef(true);
    const searchRef = useRef(search);
    const statusFilterRef = useRef(statusFilter);
    searchRef.current = search;
    statusFilterRef.current = statusFilter;
    const pageProps = usePage().props as { auth?: { isAdmin?: boolean; user?: { id: number } } };
    const isAdmin = pageProps.auth?.isAdmin ?? false;
    const userId = pageProps.auth?.user?.id;
    const items = quests.data ?? [];
    const pageTitle = isAdmin ? 'Created Quests' : 'Approval';

    useEffect(() => {
        // Sync props to local state when filters change (e.g. from navigation)
         
        setSearch(filters.search ?? '');
        setStatusFilter((filters.status as StatusFilter) || 'pending');
         
    }, [filters.search, filters.status]);

    const getParams = (overrides?: { search?: string; status?: StatusFilter }) => ({
        search: (overrides?.search !== undefined ? overrides.search : search) || undefined,
        status: (overrides?.status !== undefined ? overrides.status : statusFilter) || undefined,
    });

    const refreshTable = () => {
        router.get('/quests/created', {
            search: (searchRef.current || undefined) as string | undefined,
            status: statusFilterRef.current,
        }, { preserveScroll: true, preserveState: true });
    };

    // Listen for quest approval/rejection updates via Echo
    useEffect(() => {
        if (!window.Echo || !userId || _professorEchoSetup) return;
        _professorEchoSetup = true;

        const channel = window.Echo.private(`App.Models.User.${userId}`);
        channel.listen('.QuestApprovalUpdated', (event: { id: number; title: string; approval_status: string }) => {
            if (event.approval_status === 'approved' || event.approval_status === 'rejected') {
                playApprovalUpdateSound();
                addStatusUpdate({ id: event.id, title: event.title, approval_status: event.approval_status as 'approved' | 'rejected' });
                refreshTable();
            }
        });
    }, [userId]);

    useEffect(() => {
        if (statusUpdates.length > 0 && !updatesDismissed) {
            const t = requestAnimationFrame(() => {
                requestAnimationFrame(() => setUpdatesCardVisible(true));
            });
            return () => cancelAnimationFrame(t);
        }
        setUpdatesCardVisible(false);
    }, [statusUpdates, updatesDismissed]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        const t = setTimeout(() => {
            router.get('/quests/created', getParams(), { preserveState: true });
        }, 300);
        return () => clearTimeout(t);
        // Intentionally only when search changes to avoid request loops
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const handleStatusChange = (value: string) => {
        const newStatus = (value === 'all' ? 'all' : value) as StatusFilter;
        setStatusFilter(newStatus);
        router.get('/quests/created', getParams({ status: newStatus }), { preserveState: true });
    };

    const handleDelete = (quest: CreatedQuest) => {
        if (!isAdmin && quest.approval_status !== 'pending') return;
        setDeletingId(quest.id);
        router.delete(`/quests/${quest.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingId(null),
            onFinish: () => setDeletingId(null),
        });
    };

    const handleCancelConfirm = () => {
        if (!cancelConfirmQuest) return;
        router.delete(`/quests/${cancelConfirmQuest.id}`, {
            preserveScroll: true,
            onSuccess: () => setCancelConfirmQuest(null),
            onFinish: () => setCancelConfirmQuest(null),
        });
    };

    const hasStatusUpdates = statusUpdates.length > 0 && !updatesDismissed;
    const latestUpdate = statusUpdates[0];

    return (
        <AppLayout breadcrumbs={getBreadcrumbs(isAdmin)}>
            <Head title={pageTitle} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {hasStatusUpdates && latestUpdate && (
                    <Card
                        className={`fixed bottom-6 right-6 z-50 w-full max-w-sm shadow-lg transition-all duration-300 ease-out ${
                            latestUpdate.approval_status === 'approved'
                                ? 'border-green-200 bg-gradient-to-r from-green-50/95 to-emerald-50/80 dark:border-green-800 dark:from-green-950/50 dark:to-emerald-950/40'
                                : 'border-red-200 bg-gradient-to-r from-red-50/95 to-rose-50/80 dark:border-red-800 dark:from-red-950/50 dark:to-rose-950/40'
                        }`}
                        style={{
                            transform: updatesCardVisible ? 'translateY(0)' : 'translateY(100%)',
                        }}
                    >
                        <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                            <div className="flex items-center gap-2">
                                <div
                                    className={`flex size-9 items-center justify-center rounded-full ${latestUpdate.approval_status === 'approved' ? 'bg-green-100 dark:bg-green-900/60' : 'bg-red-100 dark:bg-red-900/60'}`}
                                >
                                    {latestUpdate.approval_status === 'approved' ? (
                                        <Check className="size-4 text-green-600 dark:text-green-400" />
                                    ) : (
                                        <XCircle className="size-4 text-red-600 dark:text-red-400" />
                                    )}
                                </div>
                                <div>
                                    <CardTitle className="text-base">
                                        {statusUpdates.length === 1
                                            ? latestUpdate.approval_status === 'approved'
                                                ? 'Quest approved'
                                                : 'Quest rejected'
                                            : `${statusUpdates.length} quests updated`}
                                    </CardTitle>
                                    <CardDescription>
                                        {statusUpdates.length === 1
                                            ? latestUpdate.approval_status === 'approved'
                                                ? 'Your quest has been approved.'
                                                : 'Your quest was rejected.'
                                            : 'Approval status changed.'}
                                    </CardDescription>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                                onClick={dismissUpdates}
                                aria-label="Dismiss"
                            >
                                <X className="size-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-2 rounded-lg border border-border/60 bg-white/60 p-3 dark:bg-black/20">
                                {statusUpdates.slice(0, 3).map((u) => (
                                    <p key={u.id} className="text-sm">
                                        <span className="font-medium text-foreground">{u.title}</span>
                                        <span className={u.approval_status === 'approved' ? ' text-green-600 dark:text-green-400' : ' text-red-600 dark:text-red-400'}>
                                            {' '}
                                            — {u.approval_status === 'approved' ? 'Approved' : 'Rejected'}
                                        </span>
                                    </p>
                                ))}
                                {statusUpdates.length > 3 && (
                                    <p className="text-xs text-muted-foreground">and {statusUpdates.length - 3} more</p>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-2 pt-0">
                            <Button size="sm" variant="default" onClick={() => { refreshTable(); dismissUpdates(); }}>
                                Refresh table
                            </Button>
                            <Button size="sm" variant="outline" onClick={dismissUpdates}>
                                Dismiss
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                <h1 className="text-xl font-semibold">{pageTitle}</h1>

                <div className="flex flex-wrap items-center gap-3">
                    {!isAdmin && (
                        <Button asChild>
                            <Link href="/quests/create">
                                <Plus className="mr-2 size-4" />
                                Create quest
                            </Link>
                        </Button>
                    )}
                    <div className="relative flex flex-1 min-w-[200px]">
                        <QuestSearchInput value={search} onChange={setSearch} />
                    </div>
                    <Select value={statusFilter} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="all">All</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Table className="border-amber-200/60 dark:border-amber-900/40 ring-1 ring-amber-200/20 dark:ring-amber-800/20">
                    <TableScroll>
                        <TableElement>
                            <thead>
                                <tr className={createdQuestsHeaderRowClass}>
                                    <th className={tableHeadClass}>Title</th>
                                    <th className={tableHeadClass}>Type</th>
                                    <th className={tableHeadClass}>Status</th>
                                    <th className={tableHeadClass}>Created</th>
                                    <th className={`${tableHeadClass} text-right`}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr className={createdQuestsBodyRowClass}>
                                        <td colSpan={5} className={tableEmptyClass}>
                                            {statusFilter === 'pending'
                                                ? 'You have not created any quests yet.'
                                                : 'No quests found.'}
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((quest) => (
                                        <tr
                                            key={quest.id}
                                            className={createdQuestsBodyRowClass}
                                        >
                                            <td className={`${tableCellClass} font-medium`}>{quest.title}</td>
                                            <td className={`${tableCellClass} capitalize`}>{quest.quest_type}</td>
                                            <td className={tableCellClass}>
                                                <Badge variant={approvalStatusVariant(quest.approval_status)}>
                                                    {approvalStatusLabel(quest.approval_status)}
                                                </Badge>
                                            </td>
                                            <td className={`${tableCellClass} text-muted-foreground`}>
                                                {formatQuestDate(quest.created_at)}
                                            </td>
                                            <td className={`${tableCellClass} text-right`}>
                                                <div className="flex justify-end gap-1">
                                                    {isAdmin ? (
                                                        <>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8"
                                                                asChild
                                                            >
                                                                <Link href={`/quests/${quest.id}?from=created&created_status=${statusFilter}`} aria-label="View">
                                                                    <Eye className="size-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8"
                                                                asChild
                                                            >
                                                                <Link href={`/quests/${quest.id}/edit`} aria-label="Edit">
                                                                    <Pencil className="size-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8 text-destructive hover:text-destructive"
                                                                disabled={deletingId === quest.id}
                                                                onClick={() => handleDelete(quest)}
                                                                aria-label="Delete"
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {quest.approval_status === 'pending' && (
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    disabled={deletingId === quest.id}
                                                                    onClick={() => setCancelConfirmQuest(quest)}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            )}
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8"
                                                                asChild
                                                            >
                                                                <Link href={`/quests/${quest.id}?from=created&created_status=${statusFilter}`} aria-label="View">
                                                                    <Eye className="size-4" />
                                                                </Link>
                                                            </Button>
                                                            {quest.approval_status === 'approved' && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="size-8"
                                                                    asChild
                                                                >
                                                                    <Link href={`/quests/${quest.id}/print-qr?from=created&created_status=${statusFilter}`} aria-label="Print QR codes">
                                                                        <Printer className="size-4" />
                                                                    </Link>
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </TableElement>
                    </TableScroll>
                </Table>

                <Dialog open={!!cancelConfirmQuest} onOpenChange={(open) => !open && setCancelConfirmQuest(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Cancel quest</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to cancel <strong>{cancelConfirmQuest?.title}</strong>? This
                                will remove the quest and it will no longer be submitted for approval. This action
                                cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCancelConfirmQuest(null)}>
                                Keep
                            </Button>
                            <Button type="button" variant="destructive" onClick={handleCancelConfirm}>
                                Cancel quest
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {quests.total > 0 && (
                    <QuestPagination
                        pagination={{
                            total: quests.total,
                            current_page: quests.current_page,
                            per_page: quests.per_page,
                            last_page: quests.last_page,
                            prev_page_url: quests.prev_page_url ?? null,
                            next_page_url: quests.next_page_url ?? null,
                        }}
                    />
                )}
            </div>
        </AppLayout>
    );
}
