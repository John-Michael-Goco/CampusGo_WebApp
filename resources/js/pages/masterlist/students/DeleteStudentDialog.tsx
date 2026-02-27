import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Student } from './types';

type Props = {
    student: Student | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
};

export function DeleteStudentDialog({
    student,
    open,
    onOpenChange,
    onConfirm,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Delete Student</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete{' '}
                        {student?.first_name} {student?.last_name} (
                        {student?.student_number})? This action cannot be
                        undone.
                    </DialogDescription>
                </DialogHeader>
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
                        variant="destructive"
                        onClick={onConfirm}
                    >
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
