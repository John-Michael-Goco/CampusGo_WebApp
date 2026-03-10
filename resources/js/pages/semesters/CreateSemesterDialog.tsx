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
import {
    SemesterFormFields,
    type SemesterFormData,
} from './SemesterFormFields';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: {
        data: SemesterFormData;
        errors: Partial<Record<keyof SemesterFormData, string>>;
        setData: (field: keyof SemesterFormData, value: string) => void;
        processing: boolean;
    };
    onSubmit: () => void;
};

export function CreateSemesterDialog({
    open,
    onOpenChange,
    form,
    onSubmit,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add semester</DialogTitle>
                    <DialogDescription>
                        Create a new semester. The current semester is determined
                        automatically when today’s date falls within its start and end dates.
                    </DialogDescription>
                </DialogHeader>
                <SemesterFormFields
                    idPrefix="create"
                    data={form.data}
                    errors={form.errors}
                    setData={form.setData}
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
