import { Head, Link, router } from '@inertiajs/react';
import { Check, Eye, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { PendingQuest, PaginatedQuests } from './shared';
import { QuestSearchInput, formatQuestDate, approvalStatusLabel, approvalStatusVariant } from './shared';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

type Props = {
    quests: PaginatedQuests<PendingQuest>;
    filters?: { search?: string; status?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Quests', href: '/quests/active' },
    { title: 'Approval', href: '/quests/approval' },
];

const approvalHeaderRowClass =
    'border-b border-orange-200/60 bg-gradient-to-r from-orange-50/90 to-orange-50/50 dark:border-orange-900/50 dark:from-orange-950/40 dark:to-orange-950/20 text-foreground';
const approvalBodyRowClass =
    'border-b border-border/60 transition-colors hover:bg-orange-50/40 dark:hover:bg-orange-950/20 last:border-b-0';

export default function QuestApprovalPage({ quests, filters = {} }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>(
        (filters.status as StatusFilter) || 'pending'
    );
    const isInitialMount = useRef(true);

    useEffect(() => {
        // Sync props to local state when filters change (e.g. from navigation)
         
        setSearch(filters.search ?? '');
        setStatusFilter((filters.status as StatusFilter) || 'pending');
         
    }, [filters.search, filters.status]);

    const getParams = (overrides?: { search?: string; status?: StatusFilter }) => ({
        search: (overrides?.search !== undefined ? overrides.search : search) || undefined,
        status: (overrides?.status !== undefined ? overrides.status : statusFilter) || undefined,
    });

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        const t = setTimeout(() => {
            router.get('/quests/approval', getParams(), { preserveState: true });
        }, 300);
        return () => clearTimeout(t);
        // Intentionally only when search changes to avoid request loops
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const handleStatusChange = (value: string) => {
        const newStatus = (value === 'all' ? 'all' : value) as StatusFilter;
        setStatusFilter(newStatus);
        router.get('/quests/approval', getParams({ status: newStatus }), { preserveState: true });
    };

    const handleApprove = (questId: number) => {
        router.put(`/quests/${questId}/approve`, { approval_status: 'approved' }, { preserveScroll: true });
    };

    const handleReject = (questId: number) => {
        router.put(`/quests/${questId}/approve`, { approval_status: 'rejected' }, { preserveScroll: true });
    };

    const items = quests.data ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Quest Approval" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold">Pending Approval</h1>

                <div className="flex flex-wrap items-center gap-3">
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

                <Table className="border-orange-200/60 dark:border-orange-900/40 ring-1 ring-orange-200/20 dark:ring-orange-800/20">
                    <TableScroll>
                        <TableElement>
                            <thead>
                                <tr className={approvalHeaderRowClass}>
                                    <th className={tableHeadClass}>Title</th>
                                    <th className={tableHeadClass}>Type</th>
                                    <th className={tableHeadClass}>Status</th>
                                    <th className={tableHeadClass}>Created</th>
                                    <th className={`${tableHeadClass} text-right`}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr className={approvalBodyRowClass}>
                                        <td colSpan={5} className={tableEmptyClass}>
                                            {statusFilter === 'pending'
                                                ? 'No quests pending approval.'
                                                : 'No quests found.'}
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((quest) => (
                                        <tr
                                            key={quest.id}
                                            className={approvalBodyRowClass}
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
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link href={`/quests/${quest.id}?from=approval&approval_status_filter=${statusFilter}`}>
                                                            <Eye className="mr-1 size-4" />
                                                            View
                                                        </Link>
                                                    </Button>
                                                    {quest.approval_status === 'pending' && (
                                                        <>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="default"
                                                                onClick={() => handleApprove(quest.id)}
                                                            >
                                                                <Check className="mr-1 size-4" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => handleReject(quest.id)}
                                                            >
                                                                <X className="mr-1 size-4" />
                                                                Reject
                                                            </Button>
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

                {quests.total > 0 && (
                    <p className="text-sm text-muted-foreground">
                        Showing {items.length} of {quests.total}.
                    </p>
                )}
            </div>
        </AppLayout>
    );
}
