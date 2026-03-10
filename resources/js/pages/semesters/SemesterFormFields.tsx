import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { parse, isValid } from 'date-fns';

export type SemesterFormData = {
    name: string;
    start_date: string;
    end_date: string;
};

function toDateOnly(value: string | null): string {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    try {
        const d = new Date(value);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    } catch {
        return '';
    }
}

function parseLocalDate(value: string): Date | undefined {
    if (!value) return undefined;
    const d = parse(value, 'yyyy-MM-dd', new Date());
    return isValid(d) ? d : undefined;
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
    const startDateObj = parseLocalDate(toDateOnly(data.start_date));

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
                        <DateTimePicker
                            value={toDateOnly(data.start_date)}
                            onChange={(val) => setData('start_date', val)}
                            placeholder="Pick start date"
                            showTime={false}
                        />
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
                        <DateTimePicker
                            value={toDateOnly(data.end_date)}
                            onChange={(val) => setData('end_date', val)}
                            placeholder="Pick end date"
                            showTime={false}
                            minDate={startDateObj}
                        />
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
