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
import { StudentFormFields } from './StudentFormFields';

type FormData = {
    student_number: string;
    first_name: string;
    last_name: string;
    course: string;
    year_level: number;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: {
        data: FormData;
        errors: Partial<Record<keyof FormData, string>>;
        setData: (field: keyof FormData, value: string | number) => void;
        processing: boolean;
    };
    onSubmit: () => void;
};

export function EditStudentDialog({
    open,
    onOpenChange,
    form,
    onSubmit,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Student</DialogTitle>
                    <DialogDescription>
                        Update student details.
                    </DialogDescription>
                </DialogHeader>
                <StudentFormFields
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
