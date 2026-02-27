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

export function CreateStudentDialog({
    open,
    onOpenChange,
    form,
    onSubmit,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Student</DialogTitle>
                    <DialogDescription>
                        Add a new student to the masterlist.
                    </DialogDescription>
                </DialogHeader>
                <StudentFormFields
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
                        Add Student
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
