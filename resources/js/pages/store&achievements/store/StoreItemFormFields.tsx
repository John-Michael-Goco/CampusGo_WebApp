import { useMemo } from 'react';
import { parse, isValid } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DateTimePicker } from '@/components/ui/date-time-picker';

export type StoreItemFormData = {
    name: string;
    description: string;
    cost_points: number | '';
    stock: number | '';
    start_date: string;
    end_date: string;
    is_visible: boolean;
};

function toDateTimeLocal(iso: string | null): string {
    if (!iso) return '';
    const match = iso.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
    if (match) return `${match[1]}T${match[2]}`;
    try {
        const d = new Date(iso);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
        return '';
    }
}

type Props = {
    idPrefix: string;
    data: StoreItemFormData;
    errors: Partial<Record<keyof StoreItemFormData, string>>;
    setData: (
        field: keyof StoreItemFormData,
        value: string | number | boolean | ''
    ) => void;
};

export function StoreItemFormFields({
    idPrefix,
    data,
    errors,
    setData,
}: Props) {
    const startDateObj = useMemo(() => {
        const val = toDateTimeLocal(data.start_date || null);
        if (!val) return undefined;
        const d = parse(val, "yyyy-MM-dd'T'HH:mm", new Date());
        return isValid(d) ? d : undefined;
    }, [data.start_date]);

    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-name`}>Name</Label>
                <Input
                    id={`${idPrefix}-name`}
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Item name"
                    autoComplete="off"
                />
                {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                )}
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-description`}>
                    Description (optional)
                </Label>
                <Input
                    id={`${idPrefix}-description`}
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Brief description"
                    autoComplete="off"
                />
                {errors.description && (
                    <p className="text-sm text-destructive">
                        {errors.description}
                    </p>
                )}
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-cost_points`}>Cost (points)</Label>
                <Input
                    id={`${idPrefix}-cost_points`}
                    type="number"
                    min={0}
                    value={data.cost_points}
                    onChange={(e) =>
                        setData(
                            'cost_points',
                            e.target.value === ''
                                ? ''
                                : parseInt(e.target.value, 10)
                        )
                    }
                    placeholder="e.g. 50"
                />
                {errors.cost_points && (
                    <p className="text-sm text-destructive">
                        {errors.cost_points}
                    </p>
                )}
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-stock`}>Stock</Label>
                <Input
                    id={`${idPrefix}-stock`}
                    type="number"
                    min={0}
                    value={data.stock}
                    onChange={(e) =>
                        setData(
                            'stock',
                            e.target.value === ''
                                ? ''
                                : parseInt(e.target.value, 10)
                        )
                    }
                    placeholder="e.g. 100"
                />
                {errors.stock && (
                    <p className="text-sm text-destructive">{errors.stock}</p>
                )}
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-start_date`}>
                    Start date (optional)
                </Label>
                <DateTimePicker
                    value={toDateTimeLocal(data.start_date || null)}
                    onChange={(val) => setData('start_date', val)}
                    placeholder="Pick start date & time"
                />
                {errors.start_date && (
                    <p className="text-sm text-destructive">
                        {errors.start_date}
                    </p>
                )}
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-end_date`}>
                    End date (optional)
                </Label>
                <DateTimePicker
                    value={toDateTimeLocal(data.end_date || null)}
                    onChange={(val) => setData('end_date', val)}
                    placeholder="Pick end date & time"
                    minDate={startDateObj}
                />
                {errors.end_date && (
                    <p className="text-sm text-destructive">
                        {errors.end_date}
                    </p>
                )}
            </div>
            <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                    <Checkbox
                        id={`${idPrefix}-is_visible`}
                        checked={data.is_visible}
                        onCheckedChange={(checked) =>
                            setData('is_visible', checked === true)
                        }
                    />
                    <Label
                        htmlFor={`${idPrefix}-is_visible`}
                        className="cursor-pointer font-normal"
                    >
                        Visible in store
                    </Label>
                </div>
            </div>
            {errors.is_visible && (
                <div className="space-y-1">
                    <p className="text-sm text-destructive">
                        {errors.is_visible}
                    </p>
                </div>
            )}
        </div>
    );
}
