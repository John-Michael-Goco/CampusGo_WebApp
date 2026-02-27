import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function QuestsHistory() {
    return (
        <AppLayout>
            <Head title="Quest History" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold">Quest History</h1>
                <p className="text-muted-foreground">View completed and past quests.</p>
            </div>
        </AppLayout>
    );
}
