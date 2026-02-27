import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function QuestsActive() {
    return (
        <AppLayout>
            <Head title="Active Quests" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold">Active Quests</h1>
                <p className="text-muted-foreground">View and manage active quests.</p>
            </div>
        </AppLayout>
    );
}
