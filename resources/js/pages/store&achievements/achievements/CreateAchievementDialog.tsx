import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import {
    AchievementFormFields
    
} from './AchievementFormFields';
import type {AchievementFormData} from './AchievementFormFields';
import type { QuestOption } from './types';

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

export function CreateAchievementDialog({
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
                    <DialogTitle>Add achievement</DialogTitle>
                    <DialogDescription>
                        Create a new achievement badge. Users earn it when they
                        meet the requirement.
                    </DialogDescription>
                </DialogHeader>
                <AchievementFormFields
                    idPrefix="create"
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
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
