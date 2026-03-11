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
    StoreItemFormFields
    
} from './StoreItemFormFields';
import type {StoreItemFormData} from './StoreItemFormFields';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: {
        data: StoreItemFormData;
        errors: Partial<Record<keyof StoreItemFormData, string>>;
        setData: (
            field: keyof StoreItemFormData,
            value: string | number | boolean | ''
        ) => void;
        processing: boolean;
    };
    onSubmit: () => void;
};

export function EditStoreItemDialog({
    open,
    onOpenChange,
    form,
    onSubmit,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit store item</DialogTitle>
                    <DialogDescription>
                        Update item details.
                    </DialogDescription>
                </DialogHeader>
                <StoreItemFormFields
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
