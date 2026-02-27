import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TITLE_OPTIONS } from './types';

type FormData = {
    employee_id: string;
    title: string;
    first_name: string;
    last_name: string;
    department: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

type Props = {
    idPrefix: string;
    data: FormData;
    errors: FormErrors;
    setData: (field: keyof FormData, value: string) => void;
};

export function ProfessorFormFields({
    idPrefix,
    data,
    errors,
    setData,
}: Props) {
    return (
        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}_employee_id`}>Employee ID</Label>
                <Input
                    id={`${idPrefix}_employee_id`}
                    value={data.employee_id}
                    onChange={(e) => setData('employee_id', e.target.value)}
                    placeholder="e.g. EMP-001"
                />
                <InputError message={errors.employee_id} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}_title`}>Title</Label>
                <Select
                    value={data.title || ''}
                    onValueChange={(v) => setData('title', v)}
                >
                    <SelectTrigger id={`${idPrefix}_title`}>
                        <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent>
                        {TITLE_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>
                                {t}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={errors.title} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}_first_name`}>First name</Label>
                <Input
                    id={`${idPrefix}_first_name`}
                    value={data.first_name}
                    onChange={(e) => setData('first_name', e.target.value)}
                    placeholder="First name"
                />
                <InputError message={errors.first_name} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}_last_name`}>Last name</Label>
                <Input
                    id={`${idPrefix}_last_name`}
                    value={data.last_name}
                    onChange={(e) => setData('last_name', e.target.value)}
                    placeholder="Last name"
                />
                <InputError message={errors.last_name} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}_department`}>Department</Label>
                <Input
                    id={`${idPrefix}_department`}
                    value={data.department}
                    onChange={(e) => setData('department', e.target.value)}
                    placeholder="Department"
                />
                <InputError message={errors.department} />
            </div>
        </div>
    );
}
