import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { UserListItem } from './types';

type Props = {
    user: UserListItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    processing?: boolean;
};

export function DeleteUserDialog({
    user,
    open,
    onOpenChange,
    onConfirm,
    processing = false,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Delete user</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete &quot;{user?.name}&quot;
                        {user?.email ? ` (${user.email})` : ''}? This action
                        cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={processing}
                    >
                        {processing ? 'Deleting…' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
