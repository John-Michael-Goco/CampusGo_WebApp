import { Link } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useSidebar } from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

function NavItemLink({ item }: { item: NavItem }) {
    const { isCurrentUrl } = useCurrentUrl();
    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                isActive={isCurrentUrl(item.href)}
                tooltip={{ children: item.title }}
            >
                <Link href={item.href} prefetch>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

function NavItemCollapsible({ item }: { item: NavItem }) {
    const { isCurrentUrl } = useCurrentUrl();
    const { state } = useSidebar();
    const hasActiveChild =
        item.items?.some((sub) => isCurrentUrl(sub.href)) ?? false;

    // When sidebar is collapsed to icon, show dropdown so user can navigate to sub-items
    if (state === 'collapsed') {
        return (
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            tooltip={{ children: item.title }}
                            data-active={hasActiveChild}
                            className="cursor-pointer"
                        >
                            {item.icon && <item.icon />}
                            <span className="min-w-0 flex-1 truncate">{item.title}</span>
                            <ChevronDown className="ml-auto size-4 shrink-0 opacity-70" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" sideOffset={4} className="min-w-[10rem]">
                        {item.items?.map((sub) => (
                            <DropdownMenuItem key={sub.title} asChild>
                                <Link href={sub.href} prefetch className="flex cursor-pointer">
                                    {sub.title}
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        );
    }

    // When expanded, show collapsible with clickable sub-links
    return (
        <Collapsible
            defaultOpen={hasActiveChild}
            className="group/collapsible"
        >
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                        tooltip={{ children: item.title }}
                        data-active={hasActiveChild}
                        className="cursor-pointer"
                    >
                        {item.icon && <item.icon />}
                        <span className="min-w-0 flex-1 truncate">{item.title}</span>
                        <ChevronDown className="ml-auto size-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                    <SidebarMenuSub>
                        {item.items?.map((sub) => (
                            <SidebarMenuSubItem key={sub.title}>
                                <SidebarMenuSubButton
                                    asChild
                                    isActive={isCurrentUrl(sub.href)}
                                    className="cursor-pointer"
                                >
                                    <Link href={sub.href} prefetch>
                                        <span>{sub.title}</span>
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
}

export function NavMain({ items = [] }: { items: NavItem[] }) {
    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="text-sidebar-foreground/80 font-semibold uppercase tracking-wider text-sm mb-2">
                Navigation
            </SidebarGroupLabel>
            <SidebarMenu className="gap-2">
                {items.map((item) =>
                    item.items?.length ? (
                        <NavItemCollapsible key={item.title} item={item} />
                    ) : (
                        <NavItemLink key={item.title} item={item} />
                    )
                )}
            </SidebarMenu>
        </SidebarGroup>
    );
}
