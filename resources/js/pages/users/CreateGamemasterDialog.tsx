import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { AvailableProfessor } from './types';
import { formatProfessorName } from './types';

type FormData = {
    professor_id: number | '';
    email: string;
    password: string;
    password_confirmation: string;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    availableProfessors: AvailableProfessor[];
    form: {
        data: FormData;
        errors: Partial<Record<keyof FormData, string>>;
        setData: (field: keyof FormData, value: string | number) => void;
        processing: boolean;
    };
    onSubmit: () => void;
};

export function CreateGamemasterDialog({
    open,
    onOpenChange,
    availableProfessors,
    form,
    onSubmit,
}: Props) {
    const [professorSearch, setProfessorSearch] = useState('');
    const [showProfessorList, setShowProfessorList] = useState(false);

    const selectedProfessor = useMemo(() => {
        if (form.data.professor_id === '') return null;
        return availableProfessors.find((p) => p.id === form.data.professor_id) ?? null;
    }, [form.data.professor_id, availableProfessors]);

    useEffect(() => {
        if (open) {
            setProfessorSearch('');
            setShowProfessorList(false);
        }
    }, [open]);

    const filteredProfessors = useMemo(() => {
        if (!professorSearch.trim()) return availableProfessors;
        const q = professorSearch.trim().toLowerCase();
        return availableProfessors.filter(
            (p) =>
                p.first_name.toLowerCase().includes(q) ||
                p.last_name.toLowerCase().includes(q) ||
                p.employee_id.toLowerCase().includes(q) ||
                p.title.toLowerCase().includes(q)
        );
    }, [availableProfessors, professorSearch]);

    const clearProfessor = () => {
        form.setData('professor_id', '');
        setProfessorSearch('');
        setShowProfessorList(false);
    };

    const selectProfessor = (p: AvailableProfessor) => {
        form.setData('professor_id', p.id);
        setProfessorSearch(formatProfessorName(p));
        setShowProfessorList(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add gamemaster</DialogTitle>
                    <DialogDescription>
                        Select a professor from the masterlist to create their
                        gamemaster account. Only professors in the list can be
                        added. Name will be saved as &quot;Title Last name, First
                        name&quot;.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="create_professor">Professor</Label>
                        {selectedProfessor ? (
                            <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                                <span className="flex-1 text-sm font-medium">
                                    {formatProfessorName(selectedProfessor)}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    onClick={clearProfessor}
                                    aria-label="Clear selection"
                                >
                                    <X className="size-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="create_professor"
                                    value={professorSearch}
                                    onChange={(e) => {
                                        setProfessorSearch(e.target.value);
                                        setShowProfessorList(true);
                                        if (form.data.professor_id !== '') {
                                            form.setData('professor_id', '');
                                        }
                                    }}
                                    placeholder="Search by name or employee ID..."
                                    className="pl-9"
                                />
                                {showProfessorList && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            aria-hidden
                                            onClick={() =>
                                                setShowProfessorList(false)
                                            }
                                        />
                                        <ul
                                            className="absolute top-full left-0 z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover py-1 text-sm shadow-md"
                                            role="listbox"
                                        >
                                            {filteredProfessors.length === 0 ? (
                                                <li className="px-3 py-2 text-muted-foreground">
                                                    No professors found.
                                                </li>
                                            ) : (
                                                filteredProfessors.map((p) => (
                                                    <li
                                                        key={p.id}
                                                        role="option"
                                                        className="cursor-pointer px-3 py-2 hover:bg-accent"
                                                        onClick={() =>
                                                            selectProfessor(p)
                                                        }
                                                    >
                                                        {formatProfessorName(p)}{' '}
                                                        <span className="text-muted-foreground">
                                                            ({p.employee_id})
                                                        </span>
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                    </>
                                )}
                            </div>
                        )}
                        <InputError message={form.errors.professor_id} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="create_email">Email</Label>
                        <Input
                            id="create_email"
                            type="email"
                            value={form.data.email}
                            onChange={(e) =>
                                form.setData('email', e.target.value)
                            }
                            placeholder="email@example.com"
                        />
                        <InputError message={form.errors.email} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="create_password">Password</Label>
                        <Input
                            id="create_password"
                            type="password"
                            value={form.data.password}
                            onChange={(e) =>
                                form.setData('password', e.target.value)
                            }
                            placeholder="123456"
                            autoComplete="new-password"
                        />
                        <InputError message={form.errors.password} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="create_password_confirmation">
                            Confirm password
                        </Label>
                        <Input
                            id="create_password_confirmation"
                            type="password"
                            value={form.data.password_confirmation}
                            onChange={(e) =>
                                form.setData(
                                    'password_confirmation',
                                    e.target.value
                                )
                            }
                            placeholder="123456"
                            autoComplete="new-password"
                        />
                        <InputError message={form.errors.password_confirmation} />
                    </div>
                </div>
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
                        Add gamemaster
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
