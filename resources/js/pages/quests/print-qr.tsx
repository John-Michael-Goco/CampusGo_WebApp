import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import PrintQrContent from '@/pages/quests/print-qr/PrintQrContent';

type Stage = { id: number; stage_number: number };

type Props = {
    quest: { id: number; title: string };
    stages: Stage[];
    /** 'active' | 'history' | 'created' when opened from list; 'quest' when opened from quest view. */
    from?: string | null;
    /** When from=quest, which list to return to when going back to quest (so quest's Back stays correct). */
    list?: string | null;
    /** When from=created, preserve the Created page status filter for back link. */
    created_status?: string | null;
    /** When from=active, preserve Active list filters for back link. */
    active_search?: string | null;
    active_quest_type?: string | null;
    active_created_by_me?: string | null;
    active_sort_by?: string | null;
    active_sort_dir?: string | null;
    /** When from=history, preserve History list filters for back link. */
    history_search?: string | null;
    history_quest_type?: string | null;
    history_created_by_me?: string | null;
    /** When from=approval, preserve Approval page status filter for back link. */
    approval_status_filter?: string | null;
};

function buildListQuery(params: Record<string, string | undefined | null>): string {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v != null && v !== '') qs.set(k, String(v));
    });
    const s = qs.toString();
    return s ? `?${s}` : '';
}

export default function QuestPrintQrPage({
    quest,
    stages,
    from: fromProp,
    list,
    created_status: createdStatusProp,
    active_search: activeSearchProp,
    active_quest_type: activeQuestTypeProp,
    active_created_by_me: activeCreatedByMeProp,
    active_sort_by: activeSortByProp,
    active_sort_dir: activeSortDirProp,
    history_search: historySearchProp,
    history_quest_type: historyQuestTypeProp,
    history_created_by_me: historyCreatedByMeProp,
    approval_status_filter: approvalStatusFilterProp,
}: Props) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const searchParams = typeof window !== 'undefined' ? new URL(window.location.href).searchParams : null;

    // Use prop first; fallback to URL so Back is correct even if prop was lost (e.g. cached page)
    const from =
        fromProp ?? (searchParams ? searchParams.get('from') : null);
    const listResolved = list ?? (searchParams ? searchParams.get('list') : null);
    const createdStatus =
        createdStatusProp ?? (searchParams ? searchParams.get('created_status') : null);
    const activeSearch = activeSearchProp ?? (searchParams ? searchParams.get('active_search') : null);
    const activeQuestType = activeQuestTypeProp ?? (searchParams ? searchParams.get('active_quest_type') : null);
    const activeCreatedByMe = activeCreatedByMeProp ?? (searchParams ? searchParams.get('active_created_by_me') : null);
    const activeSortBy = activeSortByProp ?? (searchParams ? searchParams.get('active_sort_by') : null);
    const activeSortDir = activeSortDirProp ?? (searchParams ? searchParams.get('active_sort_dir') : null);
    const historySearch = historySearchProp ?? (searchParams ? searchParams.get('history_search') : null);
    const historyQuestType = historyQuestTypeProp ?? (searchParams ? searchParams.get('history_quest_type') : null);
    const historyCreatedByMe = historyCreatedByMeProp ?? (searchParams ? searchParams.get('history_created_by_me') : null);
    const approvalStatusFilter = approvalStatusFilterProp ?? (searchParams ? searchParams.get('approval_status_filter') : null);

    const createdHref = `/quests/created${createdStatus ? `?status=${encodeURIComponent(createdStatus)}` : ''}`;
    const approvalHref = `/quests/approval${approvalStatusFilter ? `?status=${encodeURIComponent(approvalStatusFilter)}` : ''}`;
    const activeHref = `/quests/active${buildListQuery({
        search: activeSearch ?? undefined,
        quest_type: activeQuestType ?? undefined,
        created_by_me: activeCreatedByMe ?? undefined,
        sort_by: activeSortBy ?? undefined,
        sort_dir: activeSortDir ?? undefined,
    })}`;
    const historyHref = `/quests/history${buildListQuery({
        search: historySearch ?? undefined,
        quest_type: historyQuestType ?? undefined,
        created_by_me: historyCreatedByMe ?? undefined,
    })}`;

    const questShowHref =
        from === 'quest' && listResolved
            ? (() => {
                const q = new URLSearchParams();
                q.set('from', listResolved);
                if (listResolved === 'active') {
                    if (activeSearch) q.set('active_search', activeSearch);
                    if (activeQuestType) q.set('active_quest_type', activeQuestType);
                    if (activeCreatedByMe) q.set('active_created_by_me', activeCreatedByMe);
                    if (activeSortBy) q.set('active_sort_by', activeSortBy);
                    if (activeSortDir) q.set('active_sort_dir', activeSortDir);
                } else if (listResolved === 'history') {
                    if (historySearch) q.set('history_search', historySearch);
                    if (historyQuestType) q.set('history_quest_type', historyQuestType);
                    if (historyCreatedByMe) q.set('history_created_by_me', historyCreatedByMe);
                } else if (listResolved === 'created' && createdStatus) {
                    q.set('created_status', createdStatus);
                } else if (listResolved === 'approval' && approvalStatusFilter) {
                    q.set('approval_status_filter', approvalStatusFilter);
                }
                return `/quests/${quest.id}?${q.toString()}`;
            })()
            : `/quests/${quest.id}`;

    // When from=quest, back goes to quest show and we preserve list (history/active/created/approval) so the quest's Back button stays correct
    const backHref =
        from === 'history'
            ? historyHref
            : from === 'approval'
              ? approvalHref
              : from === 'created'
                ? createdHref
                : from === 'active'
                  ? activeHref
                  : from === 'quest' && listResolved
                    ? questShowHref
                    : `/quests/${quest.id}`;
    const backLabel =
        from === 'history'
            ? 'Back to quest history'
            : from === 'approval'
              ? 'Back to approval'
              : from === 'created'
                ? 'Back to my quests'
                : from === 'active'
                  ? 'Back to active quests'
                  : 'Back to quest';

    const breadcrumbSecondHref =
        from === 'history'
            ? historyHref
            : from === 'approval'
              ? approvalHref
              : from === 'created'
                ? createdHref
                : from === 'quest'
                  ? questShowHref
                  : activeHref;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Quests', href: '/quests/active' },
        { title: from === 'history' ? 'History' : from === 'approval' ? 'Approval' : from === 'created' ? 'My quests' : from === 'quest' ? quest.title : 'Active', href: breadcrumbSecondHref },
        { title: 'Print QR codes', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Print QR codes – ${quest.title}`} />
            <div className="print-qr-wrapper flex w-full min-w-0 flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="print-qr-toolbar flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={backHref} aria-label={backLabel}>
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <h1 className="text-xl font-semibold">Print QR codes – {quest.title}</h1>
                    </div>
                    <Button
                        type="button"
                        onClick={() => {
                            const prevTitle = document.title;
                            document.title = '';
                            window.print();
                            const restore = () => {
                                document.title = prevTitle;
                                window.removeEventListener('afterprint', restore);
                            };
                            window.addEventListener('afterprint', restore);
                        }}
                    >
                        <Printer className="mr-2 size-4" />
                        Print
                    </Button>
                </div>

                <PrintQrContent quest={quest} stages={stages} origin={origin} />
            </div>
        </AppLayout>
    );
}
