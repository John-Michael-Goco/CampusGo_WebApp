import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Store & Achievements', href: '/store' },
    { title: 'Store', href: '/store' },
];

export default function StorePage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Store" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1 className="text-xl font-semibold">Store</h1>
                <p className="text-muted-foreground">
                    Redeem items with your points. Content coming soon.
                </p>
            </div>
        </AppLayout>
    );
}
