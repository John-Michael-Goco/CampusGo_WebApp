import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Styled table container: rounded, border, shadow. Use with native <table> inside.
 */
function Table({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            className={cn(
                'overflow-hidden rounded-xl border border-border bg-card shadow-sm',
                'ring-1 ring-border/30 dark:ring-border/20',
                className
            )}
            {...props}
        />
    );
}

function TableScroll({ className, ...props }: React.ComponentProps<'div'>) {
    return <div className={cn('overflow-x-auto', className)} {...props} />;
}

const tableBase = 'w-full text-sm';

/**
 * Table element. Use thead/tbody as usual; apply tableHeaderRow and tableBodyRow to tr elements.
 */
const TableElement = React.forwardRef<
    HTMLTableElement,
    React.ComponentProps<'table'>
>(({ className, ...props }, ref) => (
    <table ref={ref} className={cn(tableBase, className)} {...props} />
));
TableElement.displayName = 'Table';

/** Apply to thead > tr for styled header row */
export const tableHeaderRowClass =
    'border-b border-border bg-gradient-to-r from-muted/80 to-muted/50 dark:from-muted/50 dark:to-muted/30 text-foreground';

/** Apply to tbody > tr for styled data rows with hover */
export const tableBodyRowClass =
    'border-b border-border/60 transition-colors hover:bg-muted/50 dark:hover:bg-muted/30 last:border-b-0';

/** Apply to th for consistent header cells */
export const tableHeadClass =
    'h-12 px-4 text-left font-semibold text-foreground/90';

/** Apply to td for consistent body cells */
export const tableCellClass = 'px-4 py-3.5';

/** Empty state row (e.g. colSpan cell) */
export const tableEmptyClass =
    'h-28 px-4 text-center text-muted-foreground text-sm';

export { Table, TableScroll, TableElement };
