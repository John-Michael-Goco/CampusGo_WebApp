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
import { ACT_YEAR_LEVEL_OPTIONS, COURSE_OPTIONS, YEAR_LEVEL_OPTIONS } from './types';

type FormData = {
    student_number: string;
    first_name: string;
    last_name: string;
    course: string;
    year_level: number;
    section: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

type Props = {
    idPrefix: string;
    data: FormData;
    errors: FormErrors;
    setData: (field: keyof FormData, value: string | number) => void;
};

export function StudentFormFields({
    idPrefix,
    data,
    errors,
    setData,
}: Props) {
    return (
        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}_student_number`}>
                    Student number
                </Label>
                <Input
                    id={`${idPrefix}_student_number`}
                    value={data.student_number}
                    onChange={(e) => setData('student_number', e.target.value)}
                    placeholder="e.g. 2024-001"
                />
                <InputError message={errors.student_number} />
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
                <Label htmlFor={`${idPrefix}_course`}>Course</Label>
                <Select
                    value={data.course || ''}
                    onValueChange={(v) => {
                        setData('course', v);
                        if (v === 'ACT' && data.year_level > 2) {
                            setData('year_level', 1);
                        }
                    }}
                >
                    <SelectTrigger id={`${idPrefix}_course`}>
                        <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                        {COURSE_OPTIONS.map((c) => (
                            <SelectItem key={c} value={c}>
                                {c}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={errors.course} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}_year_level`}>Year level</Label>
                <Select
                    value={
                        data.course === 'ACT'
                            ? String(
                                  ACT_YEAR_LEVEL_OPTIONS.includes(
                                      data.year_level as 1 | 2
                                  )
                                      ? data.year_level
                                      : 1
                              )
                            : String(data.year_level)
                    }
                    onValueChange={(v) =>
                        setData('year_level', parseInt(v, 10))
                    }
                >
                    <SelectTrigger id={`${idPrefix}_year_level`}>
                        <SelectValue placeholder="Select year level" />
                    </SelectTrigger>
                    <SelectContent>
                        {(data.course === 'ACT'
                            ? ACT_YEAR_LEVEL_OPTIONS
                            : YEAR_LEVEL_OPTIONS
                        ).map((y) => (
                            <SelectItem key={y} value={String(y)}>
                                {y}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={errors.year_level} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}_section`}>Section</Label>
                <Input
                    id={`${idPrefix}_section`}
                    value={data.section ?? ''}
                    onChange={(e) => setData('section', e.target.value)}
                    placeholder="e.g. A, B, 1"
                    required
                />
                <InputError message={errors.section} />
            </div>
        </div>
    );
}
