import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { QuestOption } from './types';
import { REQUIREMENT_TYPE_OPTIONS } from './types';

export type AchievementFormData = {
    name: string;
    description: string;
    requirement_type: string;
    requirement_value: number | '';
};

type Props = {
    idPrefix: string;
    data: AchievementFormData;
    errors: Partial<Record<keyof AchievementFormData, string>>;
    setData: (
        field: keyof AchievementFormData,
        value: string | number
    ) => void;
    quests?: QuestOption[];
};

export function AchievementFormFields({
    idPrefix,
    data,
    errors,
    setData,
    quests = [],
}: Props) {
    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-name`}>Name</Label>
                <Input
                    id={`${idPrefix}-name`}
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Achievement name"
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
                <Label htmlFor={`${idPrefix}-requirement_type`}>
                    Requirement type
                </Label>
                <Select
                    value={data.requirement_type}
                    onValueChange={(v) => setData('requirement_type', v)}
                >
                    <SelectTrigger id={`${idPrefix}-requirement_type`}>
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                        {REQUIREMENT_TYPE_OPTIONS.map((opt) => (
                            <SelectItem
                                key={opt.value}
                                value={opt.value}
                            >
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.requirement_type && (
                    <p className="text-sm text-destructive">
                        {errors.requirement_type}
                    </p>
                )}
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-requirement_value`}>
                    {data.requirement_type === 'complete_quest'
                        ? 'Quest'
                        : 'Requirement value'}
                </Label>
                {data.requirement_type === 'complete_quest' ? (
                    <Select
                        value={data.requirement_value === '' ? '' : String(data.requirement_value)}
                        onValueChange={(v) =>
                            setData('requirement_value', v === '' ? '' : parseInt(v, 10))
                        }
                    >
                        <SelectTrigger id={`${idPrefix}-requirement_value`}>
                            <SelectValue placeholder="Select a quest" />
                        </SelectTrigger>
                        <SelectContent>
                            {quests.map((q) => (
                                <SelectItem key={q.id} value={String(q.id)}>
                                    {q.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <Input
                        id={`${idPrefix}-requirement_value`}
                        type="number"
                        min={0}
                        value={data.requirement_value}
                        onChange={(e) =>
                            setData(
                                'requirement_value',
                                e.target.value === ''
                                    ? ''
                                    : parseInt(e.target.value, 10)
                            )
                        }
                        placeholder="e.g. 5"
                    />
                )}
                {errors.requirement_value && (
                    <p className="text-sm text-destructive">
                        {errors.requirement_value}
                    </p>
                )}
            </div>
        </div>
    );
}
