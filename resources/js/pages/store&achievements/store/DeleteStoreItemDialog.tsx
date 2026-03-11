import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { StoreItem } from './types';

type Props = {
    storeItem: StoreItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
};

export function DeleteStoreItemDialog({
    storeItem,
    open,
    onOpenChange,
    onConfirm,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Delete store item</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete &quot;
                        {storeItem?.name}&quot;? This action cannot be undone.
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
