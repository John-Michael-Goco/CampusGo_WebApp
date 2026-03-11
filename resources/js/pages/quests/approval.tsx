import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
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

                <div className="overflow-hidden rounded-lg border bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="h-11 px-4 text-left font-medium">Title</th>
                                    <th className="h-11 px-4 text-left font-medium">Type</th>
                                    <th className="h-11 px-4 text-left font-medium">Created</th>
                                    <th className="h-11 px-4 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="h-24 px-4 text-center text-muted-foreground">
                                            No quests pending approval.
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
                                                {formatQuestDate(quest.created_at)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
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
                        </table>
                    </div>
                </div>

                {quests.total > 0 && (
                    <p className="text-sm text-muted-foreground">
                        Showing {items.length} of {quests.total} pending.
                    </p>
                )}
            </div>
        </AppLayout>
    );
}
