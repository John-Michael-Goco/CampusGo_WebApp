import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { QuestOption } from './types';
import {
    AchievementFormFields,
    type AchievementFormData,
} from './AchievementFormFields';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: {
        data: AchievementFormData;
        errors: Partial<Record<keyof AchievementFormData, string>>;
        setData: (
            field: keyof AchievementFormData,
            value: string | number
        ) => void;
        processing: boolean;
    };
    onSubmit: () => void;
    quests?: QuestOption[];
};

export function EditAchievementDialog({
    open,
    onOpenChange,
    form,
    onSubmit,
    quests = [],
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit achievement</DialogTitle>
                    <DialogDescription>
                        Update achievement details.
                    </DialogDescription>
                </DialogHeader>
                <AchievementFormFields
                    idPrefix="edit"
                    data={form.data}
                    errors={form.errors}
                    setData={form.setData}
                    quests={quests}
                />
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={onSubmit}
                        disabled={form.processing}
                    >
                        {form.processing && <Spinner />}
                        Save changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
