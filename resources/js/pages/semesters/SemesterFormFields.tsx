import { Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type SemesterFormData = {
    name: string;
    start_date: string;
    end_date: string;
};

/** Format date for input type="date" (YYYY-MM-DD) */
function toDateInputValue(dateStr: string | null): string {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    } catch {
        return '';
    }
}

type Props = {
    idPrefix: string;
    data: SemesterFormData;
    errors: Partial<Record<keyof SemesterFormData, string>>;
    setData: (field: keyof SemesterFormData, value: string) => void;
};

export function SemesterFormFields({
    idPrefix,
    data,
    errors,
    setData,
}: Props) {
    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-name`}>Name</Label>
                <Input
                    id={`${idPrefix}-name`}
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="e.g. 1st Sem 2025-2026"
                    autoComplete="off"
                />
                {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                )}
            </div>
            <div className="grid gap-2">
                <Label>Date range</Label>
                <div className="flex flex-wrap gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                        <Label
                            htmlFor={`${idPrefix}-start_date`}
                            className="text-xs text-muted-foreground"
                        >
                            Start date
                        </Label>
                        <div className="relative">
                            <Input
                                id={`${idPrefix}-start_date`}
                                type="date"
                                value={toDateInputValue(data.start_date || null)}
                                onChange={(e) =>
                                    setData('start_date', e.target.value)
                                }
                                className="pr-9 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-9 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                            />
                            <Calendar
                                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                                aria-hidden
                            />
                        </div>
                        {errors.start_date && (
                            <p className="text-sm text-destructive">
                                {errors.start_date}
                            </p>
                        )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                        <Label
                            htmlFor={`${idPrefix}-end_date`}
                            className="text-xs text-muted-foreground"
                        >
                            End date
                        </Label>
                        <div className="relative">
                            <Input
                                id={`${idPrefix}-end_date`}
                                type="date"
                                value={toDateInputValue(data.end_date || null)}
                                onChange={(e) =>
                                    setData('end_date', e.target.value)
                                }
                                className="pr-9 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-9 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                            />
                            <Calendar
                                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                                aria-hidden
                            />
                        </div>
                        {errors.end_date && (
                            <p className="text-sm text-destructive">
                                {errors.end_date}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
