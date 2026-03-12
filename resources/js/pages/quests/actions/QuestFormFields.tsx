import { usePage } from '@inertiajs/react';
import { parse, isValid } from 'date-fns';
import { Info } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CreateQuestFormData, EnrollmentSemester, QuestType, QuestionTypeLevel, TargetGroup } from './types';
import {
    ACT_YEAR_LEVEL_OPTIONS,
    COURSE_OPTIONS,
    QUEST_TYPE_OPTIONS,
    YEAR_LEVEL_OPTIONS,
    isSimpleQuestType,
} from './types';

type FormErrors = Partial<Record<string, string>>;

type Props = {
    data: CreateQuestFormData;
    errors: FormErrors;
    setData: <K extends keyof CreateQuestFormData>(
        field: K,
        value: CreateQuestFormData[K]
    ) => void;
    enrollmentSemester?: EnrollmentSemester;
    /** When true (edit), start date may be in the past. When false (create), start must be today or future. */
    isEdit?: boolean;
};

const PROFESSOR_QUEST_TYPES: QuestType[] = ['custom', 'event'];
const questTypeOptionsForRole = (role: string) =>
    role === 'professor'
        ? QUEST_TYPE_OPTIONS.filter((o) => PROFESSOR_QUEST_TYPES.includes(o.value))
        : QUEST_TYPE_OPTIONS;

export function QuestFormFields({ data, errors, setData, enrollmentSemester, isEdit = false }: Props) {
    const { auth } = usePage().props;
    const isStudent = auth.user.role === 'student';
    const questTypeOptions = questTypeOptionsForRole(auth.user.role);
    const simple = isSimpleQuestType(data.quest_type);
    const [sections, setSections] = useState<string[]>([]);
    const [loadingSections, setLoadingSections] = useState(false);

    const startDateObj = useMemo(() => {
        if (!data.start_date) return undefined;
        const d = parse(data.start_date, "yyyy-MM-dd'T'HH:mm", new Date());
        return isValid(d) ? d : undefined;
    }, [data.start_date]);

    const [isStartDateInPast, setIsStartDateInPast] = useState(false);
    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect -- simple derived flag based on start_date/isEdit */
        if (isEdit || !data.start_date) {
            setIsStartDateInPast(false);
            return;
        }
        setIsStartDateInPast(new Date(data.start_date).getTime() < Date.now());
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [data.start_date, isEdit]);

    const isEndDateLessThanOneHourAfterStart = useMemo(() => {
        if (!data.start_date || !data.end_date) return false;
        const startMs = new Date(data.start_date).getTime();
        const endMs = new Date(data.end_date).getTime();
        return endMs - startMs < 60 * 60 * 1000;
    }, [data.start_date, data.end_date]);

    const target = data.target;

    const setTarget = useCallback(
        (updates: Partial<TargetGroup>) => {
            setData('target', { ...data.target, ...updates });
        },
        [data.target, setData]
    );

    const yearLevelOptions =
        target.course === 'ACT' ? ACT_YEAR_LEVEL_OPTIONS : YEAR_LEVEL_OPTIONS;

    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect -- reset/load sections when course or year_level changes */
        if (!target.course || !target.year_level) {
            setSections([]);
            return;
        }

        setLoadingSections(true);
        fetch(
            `/quests/sections?course=${encodeURIComponent(target.course)}&year_level=${encodeURIComponent(target.year_level)}`
        )
            .then((res) => res.json())
            .then((data: string[]) => setSections(data))
            .catch(() => setSections([]))
            .finally(() => setLoadingSections(false));
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [target.course, target.year_level]);

    const handleTargetTypeChange = (value: string) => {
        if (value === 'everyone') {
            setData('target', {
                target_type: 'everyone',
                course: '',
                year_level: '',
                section: '',
            });
        } else {
            setTarget({ target_type: 'specific' });
        }
    };

    const handleCourseChange = (value: string) => {
        const course = value === 'any' ? '' : value;
        const updates: Partial<TargetGroup> = { course, section: '' };
        if (
            course === 'ACT' &&
            target.year_level !== '' &&
            parseInt(target.year_level, 10) > 2
        ) {
            updates.year_level = '';
        }
        setTarget(updates);
    };

    const handleYearChange = (value: string) => {
        setTarget({
            year_level: value === 'any' ? '' : value,
            section: '',
        });
    };

    const handleSectionChange = (value: string) => {
        setTarget({ section: value === 'any' ? '' : value });
    };

    const handleTypeChange = (value: string) => {
        const questType = value as QuestType;
        setData('quest_type', questType);

        if (questType === 'enrollment') {
            setData('question_type', 'qr_scan');
        }

        if (isSimpleQuestType(questType)) {
            setData('is_elimination', false);
            setData('buy_in_points', '');
            setData('reward_custom_prize', '');
            setData('max_participants', '');
        }
    };

    const handleQuestionTypeChange = (value: string) => {
        if (data.quest_type === 'enrollment') return;
        setData('question_type', value as QuestionTypeLevel);
    };

    return (
        <div className="grid gap-6">
            {/* ── Quest target ── */}
            <fieldset className="grid gap-4 rounded-lg border p-4">
                <legend className="px-2 text-sm font-medium">
                    Quest target
                </legend>

                <div className="grid gap-2">
                    <Label htmlFor="target_type">Who can participate?</Label>
                    <Select
                        value={target.target_type}
                        onValueChange={handleTargetTypeChange}
                    >
                        <SelectTrigger id="target_type">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="everyone">Everyone</SelectItem>
                            <SelectItem value="specific">
                                Specific group
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {target.target_type === 'specific' && (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {/* Course */}
                            <div className="grid gap-2">
                                <Label htmlFor="target_course">Course</Label>
                                <Select
                                    value={target.course || 'any'}
                                    onValueChange={handleCourseChange}
                                >
                                    <SelectTrigger id="target_course">
                                        <SelectValue placeholder="Any course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="any">
                                            Any course
                                        </SelectItem>
                                        {COURSE_OPTIONS.map((c) => (
                                            <SelectItem key={c} value={c}>
                                                {c}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Year level */}
                            <div className="grid gap-2">
                                <Label htmlFor="target_year_level">
                                    Year level
                                </Label>
                                <Select
                                    value={target.year_level || 'any'}
                                    onValueChange={handleYearChange}
                                >
                                    <SelectTrigger id="target_year_level">
                                        <SelectValue placeholder="Any year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="any">
                                            Any year level
                                        </SelectItem>
                                        {yearLevelOptions.map((y) => (
                                            <SelectItem
                                                key={y}
                                                value={String(y)}
                                            >
                                                Year {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Section */}
                            <div className="grid gap-2">
                                <Label htmlFor="target_section">Section</Label>
                                <Select
                                    value={target.section || 'any'}
                                    onValueChange={handleSectionChange}
                                    disabled={
                                        !target.course ||
                                        !target.year_level ||
                                        loadingSections
                                    }
                                >
                                    <SelectTrigger id="target_section">
                                        <SelectValue
                                            placeholder={
                                                !target.course ||
                                                !target.year_level
                                                    ? 'Select course & year first'
                                                    : loadingSections
                                                      ? 'Loading...'
                                                      : 'Any section'
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="any">
                                            Any section
                                        </SelectItem>
                                        {sections.map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {!target.course &&
                            !target.year_level &&
                            !target.section && (
                                <p className="text-xs text-muted-foreground">
                                    Leave all as "Any" to target everyone. Pick
                                    at least one to restrict.
                                </p>
                            )}
                    </>
                )}
            </fieldset>

            {/* Quest type + Question type + Number of stages */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                    <Label htmlFor="quest_type">Quest type</Label>
                    <Select
                        value={data.quest_type}
                        onValueChange={handleTypeChange}
                    >
                        <SelectTrigger id="quest_type">
                            <SelectValue placeholder="Select quest type" />
                        </SelectTrigger>
                        <SelectContent>
                            {questTypeOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.quest_type} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="question_type">Question type</Label>
                    {data.quest_type === 'enrollment' ? (
                        <p className="text-sm text-muted-foreground rounded-md border bg-muted/30 px-3 py-2">
                            QR scan only
                        </p>
                    ) : (
                        <Select
                            value={data.question_type}
                            onValueChange={handleQuestionTypeChange}
                        >
                            <SelectTrigger id="question_type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="multiple_choice">Multiple choice</SelectItem>
                                <SelectItem value="qr_scan">QR scan only</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                    <InputError message={errors.question_type} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="num_stages" className="inline-flex items-center gap-1.5">
                        Stages
                        {data.is_elimination && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="size-4 shrink-0 text-destructive cursor-help" aria-label="Info" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                        Elimination quests require at least 2 stages.
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </Label>
                    <Input
                        id="num_stages"
                        type="number"
                        min={data.is_elimination ? 2 : 1}
                        value={data.num_stages}
                        onChange={(e) =>
                            setData(
                                'num_stages',
                                e.target.value === ''
                                    ? ''
                                    : Math.max(data.is_elimination ? 2 : 1, parseInt(e.target.value, 10) || (data.is_elimination ? 2 : 1))
                            )
                        }
                        placeholder={data.is_elimination ? '2' : '1'}
                    />
                    <InputError message={errors.num_stages} />
                </div>
            </div>

            {/* Enrollment semester notice */}
            {data.quest_type === 'enrollment' && (
                <div className="rounded-lg border p-4">
                    {enrollmentSemester ? (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">Linked semester:</span>
                            <span>{enrollmentSemester.name}</span>
                            <span className="text-muted-foreground">
                                ({enrollmentSemester.start_date} to {enrollmentSemester.end_date})
                            </span>
                        </div>
                    ) : (
                        <p className="text-sm text-destructive">
                            No available semester. All current/upcoming semesters already have an enrollment quest.
                        </p>
                    )}
                </div>
            )}

            {/* Title */}
            <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    placeholder="Quest title"
                />
                <InputError message={errors.title} />
            </div>

            {/* Description */}
            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Describe the quest..."
                    rows={3}
                />
                <InputError message={errors.description} />
            </div>

            {/* Reward points (always visible) */}
            <div className="grid gap-2">
                <Label htmlFor="reward_points">Reward points</Label>
                <Input
                    id="reward_points"
                    type="number"
                    min={1}
                    max={150}
                    value={data.reward_points}
                    onChange={(e) =>
                        setData(
                            'reward_points',
                            e.target.value === ''
                                ? ''
                                : Math.min(parseInt(e.target.value, 10) || 0, 150)
                        )
                    }
                    placeholder="1 – 150"
                />
                <InputError message={errors.reward_points} />
            </div>

            {/* Start / End date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
                <div className="grid gap-2">
                    <Label className="flex items-center gap-1.5">
                        Start date
                    </Label>
                    <DateTimePicker
                        value={data.start_date}
                        onChange={(val) => setData('start_date', val)}
                        placeholder="Pick start date & time"
                        minDate={isEdit ? undefined : new Date()}
                    />
                    {isStartDateInPast && !errors.start_date && (
                        <p className="text-sm text-red-500 dark:text-red-400">
                            Start date must be today or in the future.
                        </p>
                    )}
                    <InputError message={errors.start_date} />
                </div>
                <div className="grid gap-2">
                    <Label className="flex items-center gap-1.5">
                        End date
                    </Label>
                    <DateTimePicker
                        value={data.end_date}
                        onChange={(val) => setData('end_date', val)}
                        placeholder="Pick end date & time"
                        minDate={startDateObj}
                    />
                    {isEndDateLessThanOneHourAfterStart && !errors.end_date && (
                        <p className="text-sm text-red-500 dark:text-red-400">
                            End date must be at least 1 hour after start date.
                        </p>
                    )}
                    <InputError message={errors.end_date} />
                </div>
            </div>

            {/* ── Event / Custom only fields ── */}
            {!simple && (
                <>
                    <div className="grid gap-2">
                        <Label htmlFor="buy_in_points">Buy-in points</Label>
                        <Input
                            id="buy_in_points"
                            type="number"
                            min={0}
                            max={100}
                            value={data.buy_in_points}
                            onChange={(e) =>
                                setData(
                                    'buy_in_points',
                                    e.target.value === ''
                                        ? ''
                                        : Math.min(parseInt(e.target.value, 10) || 0, 100)
                                )
                            }
                            placeholder="0 – 100"
                        />
                        <InputError message={errors.buy_in_points} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="reward_custom_prize">
                            Custom prize (optional)
                        </Label>
                        <Input
                            id="reward_custom_prize"
                            value={data.reward_custom_prize}
                            onChange={(e) =>
                                setData('reward_custom_prize', e.target.value)
                            }
                            placeholder="e.g. Free coffee voucher"
                        />
                        <InputError message={errors.reward_custom_prize} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="max_participants" className="inline-flex items-center gap-1.5">
                            Max participants
                            {data.is_elimination && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="size-4 shrink-0 text-destructive cursor-help" aria-label="Info" />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-xs">
                                            Required for elimination quests.
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </Label>
                        <Input
                            id="max_participants"
                            type="number"
                            min={1}
                            value={data.max_participants}
                            onChange={(e) =>
                                setData(
                                    'max_participants',
                                    e.target.value === ''
                                        ? ''
                                        : parseInt(e.target.value, 10)
                                )
                            }
                            placeholder="e.g. 50"
                            required={data.is_elimination}
                        />
                        <InputError message={errors.max_participants} />
                    </div>

                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="is_elimination"
                            checked={data.is_elimination}
                            onCheckedChange={(checked) => {
                                setData('is_elimination', !!checked);
                                if (checked && (typeof data.num_stages !== 'number' || data.num_stages < 2)) {
                                    setData('num_stages', 2);
                                }
                            }}
                        />
                        <Label
                            htmlFor="is_elimination"
                            className="cursor-pointer"
                        >
                            Elimination quest (stages with survivors)
                        </Label>
                    </div>
                    <InputError message={errors.is_elimination} />
                </>
            )}

            {/* ── Student-only: creation cost ── */}
            {isStudent && (
                <div className="grid gap-2">
                    <Label htmlFor="creation_cost_points">
                        Creation cost (points)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                        Points deducted from your balance when the quest is
                        approved.
                    </p>
                    <Input
                        id="creation_cost_points"
                        type="number"
                        min={0}
                        value={data.creation_cost_points}
                        onChange={(e) =>
                            setData(
                                'creation_cost_points',
                                e.target.value === ''
                                    ? ''
                                    : parseInt(e.target.value, 10)
                            )
                        }
                        placeholder="e.g. 50"
                    />
                    <InputError message={errors.creation_cost_points} />
                </div>
            )}
        </div>
    );
}
