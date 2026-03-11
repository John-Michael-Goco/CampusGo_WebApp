import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableScroll,
    TableElement,
    tableHeadClass,
    tableCellClass,
    tableEmptyClass,
} from '@/components/ui/table';
import type { HistoryQuest, PaginatedQuests } from './shared';
import {
    QuestSearchInput,
    QuestPagination,
    formatQuestDate,
    outcomeLabel,
    outcomeVariant,
} from './shared';

type QuestTypeFilter = 'daily' | 'event' | 'custom' | 'enrollment' | '';

type Props = {
    quests: PaginatedQuests<HistoryQuest>;
    filters?: { search?: string; quest_type?: QuestTypeFilter; created_by_me?: boolean };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Quests', href: '/quests/active' },
    { title: 'History', href: '/quests/history' },
];

const historyHeaderRowClass =
    'border-b border-slate-200/60 bg-gradient-to-r from-slate-50/90 to-slate-50/50 dark:border-slate-800/60 dark:from-slate-900/50 dark:to-slate-900/30 text-foreground';
const historyBodyRowClass =
    'border-b border-border/60 transition-colors hover:bg-slate-50/40 dark:hover:bg-slate-800/30 last:border-b-0';

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
                        <QuestSearchInput value={search} onChange={setSearch} />
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

                <Table className="border-slate-200/60 dark:border-slate-700/50 ring-1 ring-slate-200/20 dark:ring-slate-700/30">
                    <TableScroll>
                        <TableElement>
                            <thead>
                                <tr className={historyHeaderRowClass}>
                                    <th className={tableHeadClass}>Title</th>
                                    <th className={tableHeadClass}>Type</th>
                                    <th className={tableHeadClass}>Created by</th>
                                    <th className={tableHeadClass}>Outcome</th>
                                    <th className={tableHeadClass}>Created</th>
                                    <th className={tableHeadClass}>Ended</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr className={historyBodyRowClass}>
                                        <td colSpan={6} className={tableEmptyClass}>
                                            No completed or cancelled quests found.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((quest) => (
                                        <tr
                                            key={quest.id}
                                            className={historyBodyRowClass}
                                        >
                                            <td className={`${tableCellClass} font-medium`}>{quest.title}</td>
                                            <td className={`${tableCellClass} capitalize`}>{quest.quest_type}</td>
                                            <td className={`${tableCellClass} text-muted-foreground`}>
                                                {quest.creator?.name ?? '—'}
                                            </td>
                                            <td className={tableCellClass}>
                                                <Badge variant={outcomeVariant(quest)}>
                                                    {outcomeLabel(quest)}
                                                </Badge>
                                            </td>
                                            <td className={`${tableCellClass} text-muted-foreground`}>
                                                {formatQuestDate(quest.created_at)}
                                            </td>
                                            <td className={`${tableCellClass} text-muted-foreground`}>
                                                {formatQuestDate(quest.updated_at)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </TableElement>
                    </TableScroll>
                </Table>

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
