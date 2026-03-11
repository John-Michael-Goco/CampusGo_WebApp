import type { HistoryQuest } from './types';

/** Approval status (Created / Approval page) */
export function approvalStatusLabel(status: string): string {
    if (status === 'approved') return 'Approved';
    if (status === 'rejected') return 'Rejected';
    return 'Pending';
}

export function approvalStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (status === 'approved') return 'default';
    if (status === 'rejected') return 'destructive';
    return 'secondary';
}

/** History outcome (History page) */
export function outcomeLabel(quest: HistoryQuest): string {
    if (quest.approval_status === 'rejected') return 'Rejected';
    if (quest.status === 'completed') return 'Completed';
    if (quest.status === 'cancelled') return 'Cancelled';
    return quest.status;
}

export function outcomeVariant(quest: HistoryQuest): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (quest.approval_status === 'rejected') return 'destructive';
    if (quest.status === 'completed') return 'default';
    return 'secondary';
}
