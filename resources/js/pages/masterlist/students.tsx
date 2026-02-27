import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function MasterlistStudents() {
    return (
        <AppLayout>
            <Head title="Students Masterlist" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold">Students Masterlist</h1>
                <p className="text-muted-foreground">Manage student masterlist.</p>
            </div>
        </AppLayout>
    );
}
