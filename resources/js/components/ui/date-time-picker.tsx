import * as React from 'react';
import { format, parse, isValid, set as setDateFields } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type DateTimePickerProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    minDate?: Date;
    showTime?: boolean;
    side?: 'top' | 'bottom';
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function parseValue(value: string): Date | undefined {
    if (!value) return undefined;

    const dtMatch = parse(value, "yyyy-MM-dd'T'HH:mm", new Date());
    if (isValid(dtMatch)) return dtMatch;

    const dMatch = parse(value, 'yyyy-MM-dd', new Date());
    if (isValid(dMatch)) return dMatch;

    return undefined;
}

export function DateTimePicker({
    value,
    onChange,
    placeholder,
    disabled,
    minDate,
    showTime = true,
    side = 'top',
}: DateTimePickerProps) {
    const date = parseValue(value);
    const [open, setOpen] = React.useState(false);

    const emit = (d: Date) => {
        if (showTime) {
            onChange(format(d, "yyyy-MM-dd'T'HH:mm"));
        } else {
            onChange(format(d, 'yyyy-MM-dd'));
        }
    };

    const handleDaySelect = (day: Date | undefined) => {
        if (!day) return;
        if (showTime) {
            const current = date ?? setDateFields(new Date(), { hours: 8, minutes: 0, seconds: 0 });
            const merged = setDateFields(day, {
                hours: current.getHours(),
                minutes: current.getMinutes(),
            });
            emit(merged);
        } else {
            emit(day);
            setOpen(false);
        }
    };

    const updateTime = (hours: number, minutes: number, ampm: 'AM' | 'PM') => {
        const current = date ?? new Date();
        let h = hours % 12;
        if (ampm === 'PM') h += 12;
        const merged = setDateFields(current, { hours: h, minutes });
        emit(merged);
    };

    const currentHour = date ? (date.getHours() % 12 || 12) : 12;
    const currentMinute = date ? date.getMinutes() : 0;
    const currentAmPm: 'AM' | 'PM' = date
        ? date.getHours() >= 12
            ? 'PM'
            : 'AM'
        : 'AM';

    const roundedMinute =
        MINUTES.reduce((prev, curr) =>
            Math.abs(curr - currentMinute) < Math.abs(prev - currentMinute)
                ? curr
                : prev,
        );

    const displayText = date
        ? showTime
            ? format(date, 'MMM d, yyyy  h:mm a')
            : format(date, 'MMM d, yyyy')
        : null;

    const defaultPlaceholder = showTime ? 'Pick a date & time' : 'Pick a date';

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        'w-full justify-start text-left font-normal',
                        !date && 'text-muted-foreground',
                    )}
                >
                    <CalendarIcon className="mr-2 size-4" />
                    {displayText ?? (placeholder || defaultPlaceholder)}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" side={side}>
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDaySelect}
                    disabled={minDate ? { before: minDate } : undefined}
                    defaultMonth={date}
                />
                {showTime && (
                    <div className="border-t px-4 py-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Time:</span>
                            <Select
                                value={String(currentHour)}
                                onValueChange={(v) =>
                                    updateTime(
                                        parseInt(v, 10),
                                        roundedMinute,
                                        currentAmPm,
                                    )
                                }
                            >
                                <SelectTrigger className="w-[70px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {HOURS.map((h) => (
                                        <SelectItem key={h} value={String(h)}>
                                            {String(h).padStart(2, '0')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span className="text-sm">:</span>
                            <Select
                                value={String(roundedMinute)}
                                onValueChange={(v) =>
                                    updateTime(
                                        currentHour,
                                        parseInt(v, 10),
                                        currentAmPm,
                                    )
                                }
                            >
                                <SelectTrigger className="w-[70px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {MINUTES.map((m) => (
                                        <SelectItem key={m} value={String(m)}>
                                            {String(m).padStart(2, '0')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={currentAmPm}
                                onValueChange={(v) =>
                                    updateTime(
                                        currentHour,
                                        roundedMinute,
                                        v as 'AM' | 'PM',
                                    )
                                }
                            >
                                <SelectTrigger className="w-[70px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="AM">AM</SelectItem>
                                    <SelectItem value="PM">PM</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
