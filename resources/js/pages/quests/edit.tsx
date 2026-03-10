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

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Quests', href: '/quests/active' },
        { title: 'Active', href: '/quests/active' },
        { title: 'Edit quest', href: `/quests/${questId}/edit` },
    ];

    const handleContinue = () => {
        router.get(`/quests/${questId}/edit/stages`, { questData: JSON.stringify(form.data) });
    };

    const canContinue =
        form.data.title.trim() !== '' &&
        typeof form.data.num_stages === 'number' && form.data.num_stages >= 1 &&
        (form.data.quest_type !== 'enrollment' || !!enrollmentSemester);

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
                        errors={form.errors}
                        setData={form.setData}
                        enrollmentSemester={enrollmentSemester}
                    />

                    <div className="mt-8 flex items-center justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/quests/active">Cancel</Link>
                        </Button>
                        <Button
                            type="button"
                            disabled={!canContinue}
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
