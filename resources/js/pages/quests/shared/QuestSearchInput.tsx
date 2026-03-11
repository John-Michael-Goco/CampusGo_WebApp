import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

type Props = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
};

export function QuestSearchInput({
    value,
    onChange,
    placeholder = 'Search by title or description...',
    className,
}: Props) {
    return (
        <div className={`relative flex w-full ${className ?? ''}`}>
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                type="search"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full pl-9"
            />
        </div>
    );
}
