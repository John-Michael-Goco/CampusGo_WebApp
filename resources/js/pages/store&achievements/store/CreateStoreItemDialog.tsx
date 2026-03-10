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
    StoreItemFormFields,
    type StoreItemFormData,
} from './StoreItemFormFields';

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

export function CreateStoreItemDialog({
    open,
    onOpenChange,
    form,
    onSubmit,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add store item</DialogTitle>
                    <DialogDescription>
                        Create a new item that users can redeem with points.
                    </DialogDescription>
                </DialogHeader>
                <StoreItemFormFields
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
