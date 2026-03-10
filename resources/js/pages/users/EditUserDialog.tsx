import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import type { UserListItem } from './types';

type FormData = {
    role: 'admin' | 'professor';
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: UserListItem | null;
    form: {
        data: FormData;
        errors: Partial<Record<keyof FormData, string>>;
        setData: (field: keyof FormData, value: 'admin' | 'professor') => void;
        processing: boolean;
    };
    roleOptions: readonly { value: 'admin' | 'professor'; label: string }[];
    onSubmit: () => void;
};

export function EditUserDialog({
    open,
    onOpenChange,
    user,
    form,
    roleOptions,
    onSubmit,
}: Props) {
    const canChangeRole =
        user && ['admin', 'professor'].includes(user.role);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit user</DialogTitle>
                    <DialogDescription>
                        {user && (
                            <>
                                {user.name}
                                <span className="ml-1 text-muted-foreground">
                                    ({user.email})
                                </span>
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>
                {user && (
                    <div className="grid gap-4 py-4">
                        {canChangeRole ? (
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">
                                    Role
                                </label>
                                <Select
                                    value={form.data.role}
                                    onValueChange={(v) =>
                                        form.setData(
                                            'role',
                                            v as 'admin' | 'professor'
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roleOptions.map((opt) => (
                                            <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.role} />
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Role for student accounts cannot be changed.
                            </p>
                        )}
                    </div>
                )}
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    {user && canChangeRole && (
                        <Button
                            type="button"
                            onClick={onSubmit}
                            disabled={form.processing}
                        >
                            {form.processing && <Spinner />}
                            Save
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
