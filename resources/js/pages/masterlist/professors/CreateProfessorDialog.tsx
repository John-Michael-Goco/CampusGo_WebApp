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
import { ProfessorFormFields } from './ProfessorFormFields';

type FormData = {
    employee_id: string;
    title: string;
    first_name: string;
    last_name: string;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: {
        data: FormData;
        errors: Partial<Record<keyof FormData, string>>;
        setData: (field: keyof FormData, value: string) => void;
        processing: boolean;
    };
    onSubmit: () => void;
};

export function CreateProfessorDialog({
    open,
    onOpenChange,
    form,
    onSubmit,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Professor</DialogTitle>
                    <DialogDescription>
                        Add a new professor to the masterlist.
                    </DialogDescription>
                </DialogHeader>
                <ProfessorFormFields
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
                        Add Professor
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
