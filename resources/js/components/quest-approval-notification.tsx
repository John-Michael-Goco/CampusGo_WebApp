import { usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { Bell, X } from 'lucide-react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { formatDateTime } from '@/pages/quests/shared/utils';

function playNotificationSound(): void {
    try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const playTone = (frequency: number, startTime: number, duration: number, volume = 0.14) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = frequency;
            osc.type = 'sine';
            gain.gain.setValueAtTime(volume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            osc.start(startTime);
            osc.stop(startTime + duration);
        };
        const play = () => {
            playTone(523.25, 0, 0.28);
            playTone(659.25, 0.32, 0.28);
            playTone(783.99, 0.64, 0.28);
            playTone(1046.5, 0.96, 0.4);
        };
        if (ctx.state === 'suspended') {
            ctx.resume().then(play).catch(() => {});
        } else {
            play();
        }
    } catch {
        // ignore
    }
}

export type PendingQuestNotification = {
    id: number;
    title: string;
    quest_type: string;
    created_at: string | null;
    creator: { id: number; name: string } | null;
};

// Module-level store so state survives component remounts (Inertia page navigations)
let _quests: PendingQuestNotification[] = [];
let _dismissed = false;
const _listeners = new Set<() => void>();

function notifyListeners() {
    _listeners.forEach((fn) => fn());
}

function getSnapshot() {
    return { quests: _quests, dismissed: _dismissed };
}

function subscribe(listener: () => void) {
    _listeners.add(listener);
    return () => _listeners.delete(listener);
}

function addQuest(quest: PendingQuestNotification) {
    const byId = new Map(_quests.map((q) => [q.id, q]));
    byId.set(quest.id, quest);
    _quests = Array.from(byId.values()).sort(
        (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    );
    _dismissed = false;
    notifyListeners();
}

function dismiss() {
    _dismissed = true;
    notifyListeners();
}

// Ref to track snapshot identity for useSyncExternalStore
let _snapshotRef = getSnapshot();
function getStableSnapshot() {
    const next = getSnapshot();
    if (next.quests !== _snapshotRef.quests || next.dismissed !== _snapshotRef.dismissed) {
        _snapshotRef = next;
    }
    return _snapshotRef;
}

let _echoSetup = false;

export function QuestApprovalNotification() {
    const page = usePage();
    const { auth } = page.props as {
        auth?: { isAdmin?: boolean };
    };
    const isAdmin = auth?.isAdmin ?? false;
    const isOnApprovalPage = typeof page.url === 'string' && page.url.startsWith('/quests/approval');
    const isOnApprovalPageRef = useRef(isOnApprovalPage);
    isOnApprovalPageRef.current = isOnApprovalPage;

    const store = useSyncExternalStore(subscribe, getStableSnapshot);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!isAdmin || !window.Echo || _echoSetup) return;
        _echoSetup = true;

        const channel = window.Echo.private('admin.quests');
        channel.listen('.QuestSubmittedForApproval', (event: PendingQuestNotification) => {
            playNotificationSound();
            addQuest(event);
        });
    }, [isAdmin]);

    useEffect(() => {
        if (store.quests.length > 0 && !store.dismissed) {
            const t = requestAnimationFrame(() => {
                requestAnimationFrame(() => setIsVisible(true));
            });
            return () => cancelAnimationFrame(t);
        }
        setIsVisible(false);
    }, [store.quests.length, store.dismissed]);

    if (!isAdmin || store.quests.length === 0 || store.dismissed) return null;

    const latest = store.quests[0];
    const count = store.quests.length;

    return (
        <Card
            className="fixed bottom-6 right-6 z-50 w-full max-w-sm border-orange-200 bg-gradient-to-r from-orange-50/95 to-amber-50/80 shadow-lg transition-all duration-300 ease-out dark:border-orange-800 dark:from-orange-950/50 dark:to-amber-950/40"
            style={{
                transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
            }}
        >
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/60">
                        <Bell className="size-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <CardTitle className="text-base">
                            {count === 1
                                ? 'New quest submitted for approval'
                                : `${count} new quests pending approval`}
                        </CardTitle>
                        <CardDescription>
                            {count === 1
                                ? 'Review and approve or reject below.'
                                : 'Latest submission:'}
                        </CardDescription>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={dismiss}
                    aria-label="Dismiss"
                >
                    <X className="size-4" />
                </Button>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="rounded-lg border border-orange-200/60 bg-white/60 p-3 dark:border-orange-800/50 dark:bg-black/20">
                    <p className="font-medium text-foreground">{latest.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        <span className="capitalize">{latest.quest_type}</span>
                        {latest.creator?.name && (
                            <> · by {latest.creator.name}</>
                        )}
                    </p>
                    {latest.created_at && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatDateTime(latest.created_at)}
                        </p>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex gap-2 pt-0">
                <Button asChild size="sm" variant="default" onClick={dismiss}>
                    <Link href={`/quests/${latest.id}?from=approval`}>Review quest</Link>
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={dismiss}
                >
                    Dismiss
                </Button>
            </CardFooter>
        </Card>
    );
}
