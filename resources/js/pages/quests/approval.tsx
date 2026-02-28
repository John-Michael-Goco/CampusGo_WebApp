import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function QuestsApproval() {
    return (
        <AppLayout>
            <Head title="Quest Approval" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold">Quest Approval</h1>
                <p className="text-muted-foreground">
                    Review and approve quest submissions.
                </p>
            </div>
        </AppLayout>
    );
}
