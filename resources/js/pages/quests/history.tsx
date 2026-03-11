import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type HistoryQuest = {
    id: number;
    title: string;
    quest_type: string;
    status: string;
    approval_status: string;
    created_at: string;
    updated_at: string;
    creator?: { id: number; name: string } | null;
};

type PaginatedQuests = {
    data: HistoryQuest[];
    total: number;
    current_page: number;
    per_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

type QuestTypeFilter = 'daily' | 'event' | 'custom' | 'enrollment' | '';

type Props = {
    quests: PaginatedQuests;
    filters?: { search?: string; quest_type?: QuestTypeFilter; created_by_me?: boolean };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Quests', href: '/quests/active' },
    { title: 'History', href: '/quests/history' },
];

function outcomeLabel(quest: HistoryQuest): string {
    if (quest.approval_status === 'rejected') return 'Rejected';
    if (quest.status === 'completed') return 'Completed';
    if (quest.status === 'cancelled') return 'Cancelled';
    return quest.status;
}

function outcomeVariant(quest: HistoryQuest): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (quest.approval_status === 'rejected') return 'destructive';
    if (quest.status === 'completed') return 'default';
    return 'secondary';
}

export default function QuestHistoryPage({ quests, filters = {} }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [questType, setQuestType] = useState<QuestTypeFilter>(filters.quest_type ?? '');
    const [createdByMe, setCreatedByMe] = useState(filters.created_by_me ?? false);
    const isInitialMount = useRef(true);
    const items = quests.data ?? [];

    useEffect(() => {
        setSearch(filters.search ?? '');
        setQuestType(filters.quest_type ?? '');
        setCreatedByMe(filters.created_by_me ?? false);
    }, [filters.search, filters.quest_type, filters.created_by_me]);

    const getHistoryParams = (overrides?: { quest_type?: QuestTypeFilter; created_by_me?: boolean }) => ({
        search: search || undefined,
        quest_type: (overrides?.quest_type !== undefined ? overrides.quest_type : questType) || undefined,
        created_by_me: (overrides?.created_by_me !== undefined ? overrides.created_by_me : createdByMe) ? '1' : undefined,
    });

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        const t = setTimeout(() => {
            router.get('/quests/history', getHistoryParams(), { preserveState: true });
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    const handleQuestTypeChange = (value: string) => {
        const newType = (value === 'all' ? '' : value) as QuestTypeFilter;
        setQuestType(newType);
        router.get('/quests/history', getHistoryParams({ quest_type: newType }), { preserveState: true });
    };

    const handleCreatedByMeChange = (value: boolean) => {
        setCreatedByMe(value);
        router.get('/quests/history', getHistoryParams({ created_by_me: value }), { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Quest History" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold">Quest History</h1>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by title or description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9"
                        />
                    </div>
                    <Select
                        value={createdByMe ? 'mine' : 'all'}
                        onValueChange={(v) => handleCreatedByMeChange(v === 'mine')}
                    >
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="All quests" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All quests</SelectItem>
                            <SelectItem value="mine">Created by me</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={questType || 'all'}
                        onValueChange={handleQuestTypeChange}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All quest types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All quest types</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="event">Event</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                            <SelectItem value="enrollment">Enrollment</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="overflow-hidden rounded-lg border bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="h-11 px-4 text-left font-medium">Title</th>
                                    <th className="h-11 px-4 text-left font-medium">Type</th>
                                    <th className="h-11 px-4 text-left font-medium">Created by</th>
                                    <th className="h-11 px-4 text-left font-medium">Outcome</th>
                                    <th className="h-11 px-4 text-left font-medium">Created</th>
                                    <th className="h-11 px-4 text-left font-medium">Ended</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="h-24 px-4 text-center text-muted-foreground">
                                            No completed or cancelled quests found.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((quest) => (
                                        <tr
                                            key={quest.id}
                                            className="border-b transition-colors hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3 font-medium">{quest.title}</td>
                                            <td className="px-4 py-3 capitalize">{quest.quest_type}</td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {quest.creator?.name ?? '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={outcomeVariant(quest)}>
                                                    {outcomeLabel(quest)}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {quest.created_at
                                                    ? new Date(quest.created_at).toLocaleDateString(undefined, {
                                                          year: 'numeric',
                                                          month: 'short',
                                                          day: 'numeric',
                                                      })
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {quest.updated_at
                                                    ? new Date(quest.updated_at).toLocaleDateString(undefined, {
                                                          year: 'numeric',
                                                          month: 'short',
                                                          day: 'numeric',
                                                      })
                                                    : '—'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {quests.total > 0 && (
                    <div className="flex items-center justify-between gap-4 border-t pt-4">
                        <p className="text-sm text-muted-foreground">
                            Showing {(quests.current_page - 1) * quests.per_page + 1} to{' '}
                            {Math.min(quests.current_page * quests.per_page, quests.total)} of {quests.total} entries
                        </p>
                        {quests.last_page > 1 && (
                            <div className="flex items-center gap-2">
                                {quests.prev_page_url ? (
                                    <Link
                                        href={quests.prev_page_url}
                                        preserveState
                                        className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                                    >
                                        <ArrowLeft className="size-4" />
                                        Previous
                                    </Link>
                                ) : (
                                    <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-transparent bg-muted/50 px-3 py-2 text-sm font-medium text-muted-foreground">
                                        <ArrowLeft className="size-4" />
                                        Previous
                                    </span>
                                )}
                                <span className="text-sm text-muted-foreground">
                                    Page {quests.current_page} of {quests.last_page}
                                </span>
                                {quests.next_page_url ? (
                                    <Link
                                        href={quests.next_page_url}
                                        preserveState
                                        className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                                    >
                                        Next
                                        <ArrowRight className="size-4" />
                                    </Link>
                                ) : (
                                    <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-transparent bg-muted/50 px-3 py-2 text-sm font-medium text-muted-foreground">
                                        Next
                                        <ArrowRight className="size-4" />
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
