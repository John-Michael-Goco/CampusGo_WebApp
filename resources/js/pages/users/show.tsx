import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, User } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { QuestSearchInput } from '@/pages/quests/shared';
import { formatQuestDate } from '@/pages/quests/shared';
import { approvalStatusLabel, approvalStatusVariant } from '@/pages/quests/shared/approval-status';
import type { BreadcrumbItem } from '@/types';

type UserShow = {
    id: number;
    name: string;
    email: string;
    role: string;
    school_id: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar?: string | null;
    course?: string | null;
    year_level?: number | string | null;
    section?: string | null;
    is_enrolled?: boolean;
    points_balance?: number;
    level?: number;
    total_completed_quests?: number;
};

type QuestCreated = {
    id: number;
    title: string;
    quest_type: string;
    approval_status: string;
    status: string;
    created_at: string | null;
};

type QuestParticipated = {
    id: number;
    quest_id: number;
    quest_title: string;
    quest_status: string | null;
    participant_status: string;
    current_stage: number;
    joined_at: string | null;
};

type AchievementUnlocked = {
    id: number;
    achievement_id: number;
    name: string;
    description: string | null;
    requirement_type: string | null;
    earned_at: string | null;
};

type Props = {
    user: UserShow;
    can_change_role: boolean;
    achievements_unlocked: AchievementUnlocked[];
    quests_created: QuestCreated[];
    quests_participated: QuestParticipated[];
};

function participantStatusLabel(status: string): string {
    const map: Record<string, string> = {
        active: 'In progress',
        awaiting_ranking: 'In progress',
        winner: 'Won',
        eliminated: 'Eliminated',
        quit: 'Quit',
    };
    return map[status] ?? status;
}

function formatDateTime(iso: string | null): string {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        return d.toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    } catch {
        return '—';
    }
}

export default function UserShowPage({ user, can_change_role, achievements_unlocked, quests_created, quests_participated }: Props) {
    const [questSearch, setQuestSearch] = useState('');
    const [participationSearch, setParticipationSearch] = useState('');
    const [updatingRole, setUpdatingRole] = useState(false);

    const filteredQuests = useMemo(() => {
        const q = questSearch.trim().toLowerCase();
        if (!q) return quests_created;
        return quests_created.filter(
            (quest) =>
                quest.title.toLowerCase().includes(q) ||
                (quest.quest_type && quest.quest_type.toLowerCase().includes(q))
        );
    }, [quests_created, questSearch]);

    const filteredParticipations = useMemo(() => {
        const q = participationSearch.trim().toLowerCase();
        if (!q) return quests_participated;
        return quests_participated.filter(
            (p) =>
                p.quest_title.toLowerCase().includes(q) ||
                participantStatusLabel(p.participant_status).toLowerCase().includes(q)
        );
    }, [quests_participated, participationSearch]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Users', href: '/users' },
        { title: user.name || user.email, href: `/users/${user.id}` },
    ];

    const fullName =
        user.first_name != null || user.last_name != null
            ? [user.last_name, user.first_name].filter(Boolean).join(', ')
            : user.name || user.email;

    const getInitials = (n: string) =>
        n
            .trim()
            .split(/\s+/)
            .map((s) => s[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || '?';

    const handleRoleChange = (newRole: string) => {
        if (newRole !== 'admin' && newRole !== 'professor') return;
        setUpdatingRole(true);
        router.put(`/users/${user.id}`, { role: newRole }, {
            preserveScroll: true,
            onFinish: () => setUpdatingRole(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={fullName || 'User'} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/users" aria-label="Back to users">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-semibold">{fullName || 'User'}</h1>
                </div>

                <section className="rounded-lg border bg-card p-4">
                    <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Details
                    </h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="flex flex-col items-center justify-center gap-2">
                            <Avatar className="size-32">
                                <AvatarImage src={user.avatar ?? undefined} alt={fullName ?? undefined} />
                                <AvatarFallback>
                                    {fullName ? getInitials(fullName) : <User className="size-14 text-muted-foreground" />}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">Profile</span>
                        </div>
                        <div className="space-y-3">
                            {user.school_id != null && (
                                <div>
                                    <dt className="text-xs font-medium text-muted-foreground">School ID</dt>
                                    <dd className="mt-0.5 text-sm">{user.school_id}</dd>
                                </div>
                            )}
                            <div>
                                <dt className="text-xs font-medium text-muted-foreground">Full name</dt>
                                <dd className="mt-0.5 text-sm">{fullName || '—'}</dd>
                            </div>
                            {user.role === 'student' && (
                                <>
                                    {user.course != null && user.course !== '' && (
                                        <div>
                                            <dt className="text-xs font-medium text-muted-foreground">Course</dt>
                                            <dd className="mt-0.5 text-sm">{user.course}</dd>
                                        </div>
                                    )}
                                    {(user.year_level != null || user.section != null) && (
                                        <div>
                                            <dt className="text-xs font-medium text-muted-foreground">Year & section</dt>
                                            <dd className="mt-0.5 text-sm">
                                                {[user.year_level, user.section].filter(Boolean).join('-') || '—'}
                                            </dd>
                                        </div>
                                    )}
                                    <div>
                                        <dt className="text-xs font-medium text-muted-foreground">Enrolled</dt>
                                        <dd className="mt-0.5 text-sm">{user.is_enrolled ? 'Yes' : 'No'}</dd>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="space-y-3">
                            <div>
                                <dt className="text-xs font-medium text-muted-foreground">Email</dt>
                                <dd className="mt-0.5 text-sm font-mono">{user.email}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-muted-foreground">Role</dt>
                                <dd className="mt-0.5 flex items-center gap-2">
                                    {can_change_role ? (
                                        <Select
                                            value={user.role}
                                            onValueChange={handleRoleChange}
                                            disabled={updatingRole}
                                        >
                                            <SelectTrigger className="w-[140px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="professor">Gamemaster</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <span className="capitalize">{user.role}</span>
                                    )}
                                </dd>
                            </div>
                            {user.role === 'student' && (
                                <>
                                    <div>
                                        <dt className="text-xs font-medium text-muted-foreground">Points balance</dt>
                                        <dd className="mt-0.5 text-sm">{user.points_balance ?? 0}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium text-muted-foreground">Level</dt>
                                        <dd className="mt-0.5 text-sm">{user.level ?? 0}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium text-muted-foreground">Total completed quests</dt>
                                        <dd className="mt-0.5 text-sm">{user.total_completed_quests ?? 0}</dd>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                {user.role === 'student' && (
                    <>
                        <section className="rounded-lg border bg-card p-4">
                            <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                Achievements unlocked
                            </h2>
                            <div className="overflow-hidden rounded-md border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="h-10 px-4 text-left font-medium">Achievement</th>
                                            <th className="h-10 px-4 text-left font-medium">Description</th>
                                            <th className="h-10 px-4 text-left font-medium">Earned at</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {achievements_unlocked.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="h-20 px-4 text-center text-muted-foreground">
                                                    No achievements unlocked yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            achievements_unlocked.map((a) => (
                                                <tr key={a.id} className="border-b transition-colors hover:bg-muted/30">
                                                    <td className="px-4 py-3 font-medium">{a.name}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {a.description ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {formatDateTime(a.earned_at)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="rounded-lg border bg-card p-4">
                            <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                Quests participated
                            </h2>
                            <div className="mb-4">
                                <QuestSearchInput
                                    value={participationSearch}
                                    onChange={setParticipationSearch}
                                    placeholder="Search by quest title or status..."
                                />
                            </div>
                            <div className="overflow-hidden rounded-md border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="h-10 px-4 text-left font-medium">Quest</th>
                                            <th className="h-10 px-4 text-left font-medium">Status</th>
                                            <th className="h-10 px-4 text-left font-medium">Stage</th>
                                            <th className="h-10 px-4 text-left font-medium">Quest status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredParticipations.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="h-20 px-4 text-center text-muted-foreground">
                                                    {participationSearch.trim()
                                                        ? 'No participations match your search.'
                                                        : 'No quest participations yet.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredParticipations.map((p) => (
                                                <tr key={p.id} className="border-b transition-colors hover:bg-muted/30">
                                                    <td className="px-4 py-3 font-medium">{p.quest_title}</td>
                                                    <td className="px-4 py-3">{participantStatusLabel(p.participant_status)}</td>
                                                    <td className="px-4 py-3">{p.current_stage}</td>
                                                    <td className="px-4 py-3 text-muted-foreground capitalize">
                                                        {p.quest_status ?? '—'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}

                {(user.role === 'admin' || user.role === 'professor') && (
                    <section className="rounded-lg border bg-card p-4">
                        <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Quests created
                        </h2>
                        <div className="mb-4">
                            <QuestSearchInput
                                value={questSearch}
                                onChange={setQuestSearch}
                                placeholder="Search by title or type..."
                            />
                        </div>
                        <div className="overflow-hidden rounded-md border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="h-10 px-4 text-left font-medium">Title</th>
                                        <th className="h-10 px-4 text-left font-medium">Type</th>
                                        <th className="h-10 px-4 text-left font-medium">Status</th>
                                        <th className="h-10 px-4 text-left font-medium">Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredQuests.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="h-20 px-4 text-center text-muted-foreground">
                                                {questSearch.trim()
                                                    ? 'No quests match your search.'
                                                    : 'No quests created yet.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredQuests.map((quest) => (
                                            <tr key={quest.id} className="border-b transition-colors hover:bg-muted/30">
                                                <td className="px-4 py-3 font-medium">{quest.title}</td>
                                                <td className="px-4 py-3 capitalize">{quest.quest_type}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={approvalStatusVariant(quest.approval_status)}>
                                                        {approvalStatusLabel(quest.approval_status)}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {formatQuestDate(quest.created_at)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
