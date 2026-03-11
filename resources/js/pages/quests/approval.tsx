import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableScroll,
    TableElement,
    tableHeaderRowClass,
    tableBodyRowClass,
    tableHeadClass,
    tableCellClass,
    tableEmptyClass,
} from '@/components/ui/table';
import type { PendingQuest, PaginatedQuests } from './shared';
import { QuestSearchInput, formatQuestDate } from './shared';

type Props = {
    quests: PaginatedQuests<PendingQuest>;
    filters?: { search?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Quests', href: '/quests/active' },
    { title: 'Approval', href: '/quests/approval' },
];

export default function QuestApprovalPage({ quests, filters = {} }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const isInitialMount = useRef(true);

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        const t = setTimeout(() => {
            router.get('/quests/approval', { search: search || undefined }, { preserveState: true });
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

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

                <QuestSearchInput value={search} onChange={setSearch} />

                <Table>
                    <TableScroll>
                        <TableElement>
                            <thead>
                                <tr className={tableHeaderRowClass}>
                                    <th className={tableHeadClass}>Title</th>
                                    <th className={tableHeadClass}>Type</th>
                                    <th className={tableHeadClass}>Created</th>
                                    <th className={`${tableHeadClass} text-right`}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr className={tableBodyRowClass}>
                                        <td colSpan={4} className={tableEmptyClass}>
                                            No quests pending approval.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((quest) => (
                                        <tr
                                            key={quest.id}
                                            className={tableBodyRowClass}
                                        >
                                            <td className={`${tableCellClass} font-medium`}>{quest.title}</td>
                                            <td className={`${tableCellClass} capitalize`}>{quest.quest_type}</td>
                                            <td className={`${tableCellClass} text-muted-foreground`}>
                                                {formatQuestDate(quest.created_at)}
                                            </td>
                                            <td className={`${tableCellClass} text-right`}>
                                                <div className="flex justify-end gap-2">
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
                        Showing {items.length} of {quests.total} pending.
                    </p>
                )}
            </div>
        </AppLayout>
    );
}
