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

export function EditSemesterDialog({
    open,
    onOpenChange,
    form,
    onSubmit,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit semester</DialogTitle>
                    <DialogDescription>
                        Update semester details.
                    </DialogDescription>
                </DialogHeader>
                <SemesterFormFields
                    idPrefix="edit"
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
                        Save changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
