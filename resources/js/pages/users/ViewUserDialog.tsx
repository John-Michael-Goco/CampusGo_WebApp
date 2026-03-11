import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { UserListItem } from './types';

type Props = {
    user: UserListItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function ViewUserDialog({ user, open, onOpenChange }: Props) {
    if (!user) return null;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>User details</DialogTitle>
                </DialogHeader>
                <dl className="grid gap-2 text-sm">
                    <div>
                        <dt className="text-muted-foreground">Name</dt>
                        <dd className="font-medium">{user.name}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">Email</dt>
                        <dd className="font-medium font-mono">{user.email}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">Role</dt>
                        <dd className="font-medium capitalize">{user.role}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">Points</dt>
                        <dd className="font-medium">{user.points_balance ?? 0}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">Level</dt>
                        <dd className="font-medium">{user.level ?? 1}</dd>
                    </div>
                </dl>
            </DialogContent>
        </Dialog>
    );
}
