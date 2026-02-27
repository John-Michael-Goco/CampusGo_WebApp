import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function LogsIndex() {
    return (
        <AppLayout>
            <Head title="Logs" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold">Logs</h1>
                <p className="text-muted-foreground">View application logs.</p>
            </div>
        </AppLayout>
    );
}
