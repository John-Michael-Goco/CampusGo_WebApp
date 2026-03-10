import { useState } from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { QuestFormFields } from './create/QuestFormFields';
import type { CreateQuestFormData, EnrollmentSemester } from './create/types';

type PageProps = {
    questId: number;
    questData: CreateQuestFormData;
    enrollmentSemester?: EnrollmentSemester;
};

export default function EditQuestPage() {
    const { questId, questData, enrollmentSemester } = usePage<PageProps>().props;
    const form = useForm<CreateQuestFormData>(questData);
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Quests', href: '/quests/active' },
        { title: 'Active', href: '/quests/active' },
        { title: 'Edit quest', href: `/quests/${questId}/edit` },
    ];

    const validateStep1 = (): Record<string, string> => {
        const e: Record<string, string> = {};
        if (!form.data.title.trim()) e.title = 'Quest title is required.';
        if (typeof form.data.num_stages !== 'number' || form.data.num_stages < 1) e.num_stages = 'At least 1 stage is required.';
        if (typeof form.data.reward_points !== 'number' || form.data.reward_points < 1) e.reward_points = 'Reward points are required (1–150).';
        if (!form.data.start_date) e.start_date = 'Start date is required.';
        if (!form.data.end_date) e.end_date = 'End date is required.';
        if (form.data.start_date && form.data.end_date && form.data.start_date > form.data.end_date) e.end_date = 'End date must be on or after start date.';
        if (form.data.quest_type === 'enrollment' && !enrollmentSemester) e.quest_type = 'No available semester for enrollment quests.';
        return e;
    };

    const handleContinue = () => {
        const errs = validateStep1();
        if (Object.keys(errs).length > 0) {
            setClientErrors(errs);
            return;
        }
        setClientErrors({});
        router.get(`/quests/${questId}/edit/stages`, { questData: JSON.stringify(form.data) });
    };

    const mergedErrors = { ...form.errors, ...clientErrors };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Quest" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h1 className="text-xl font-semibold">Edit Quest</h1>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/quests/active">Back to active quests</Link>
                    </Button>
                </div>

                <div className="mx-auto w-full max-w-4xl">
                    <QuestFormFields
                        data={form.data}
                        errors={mergedErrors}
                        setData={form.setData}
                        enrollmentSemester={enrollmentSemester}
                    />

                    <div className="mt-8 flex items-center justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/quests/active">Cancel</Link>
                        </Button>
                        <Button
                            type="button"
                            onClick={handleContinue}
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
