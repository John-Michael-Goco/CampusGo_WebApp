import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function UsersIndex() {
    return (
        <AppLayout>
            <Head title="Users" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold">Users</h1>
                <p className="text-muted-foreground">Manage users.</p>
            </div>
        </AppLayout>
    );
}
