import { Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

type PaginationMeta = {
    total: number;
    current_page: number;
    per_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

type Props = {
    pagination: PaginationMeta;
    label?: string;
};

export function QuestPagination({ pagination, label = 'entries' }: Props) {
    const { total, current_page, per_page, last_page, prev_page_url, next_page_url } = pagination;
    if (total === 0) return null;

    const from = (current_page - 1) * per_page + 1;
    const to = Math.min(current_page * per_page, total);

    return (
        <div className="flex items-center justify-between gap-4 border-t pt-4">
            <p className="text-sm text-muted-foreground">
                Showing {from} to {to} of {total} {label}
            </p>
            {last_page > 1 && (
                <div className="flex items-center gap-2">
                    {prev_page_url ? (
                        <Link
                            href={prev_page_url}
                            preserveState
                            className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                        >
                            <ArrowLeft className="size-4" />
                            Previous
                        </Link>
                    ) : (
                        <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-transparent bg-muted/50 px-3 py-2 text-sm font-medium text-muted-foreground">
                            <ArrowLeft className="size-4" />
                            Previous
                        </span>
                    )}
                    <span className="text-sm text-muted-foreground">
                        Page {current_page} of {last_page}
                    </span>
                    {next_page_url ? (
                        <Link
                            href={next_page_url}
                            preserveState
                            className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                        >
                            Next
                            <ArrowRight className="size-4" />
                        </Link>
                    ) : (
                        <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-transparent bg-muted/50 px-3 py-2 text-sm font-medium text-muted-foreground">
                            Next
                            <ArrowRight className="size-4" />
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
