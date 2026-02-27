import { Link } from '@inertiajs/react';
import {
    ClipboardList,
    LayoutGrid,
    ListTodo,
    ScrollText,
    Users,
} from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { dashboard } from '@/routes';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Quests',
        href: '/quests/active',
        icon: ListTodo,
        items: [
            { title: 'Active quests', href: '/quests/active', icon: null },
            { title: 'History', href: '/quests/history', icon: null },
        ],
    },
    {
        title: 'Users',
        href: '/users',
        icon: Users,
    },
    {
        title: 'Masterlist',
        href: '/masterlist/students',
        icon: ClipboardList,
        items: [
            { title: 'Students', href: '/masterlist/students', icon: null },
            { title: 'Professors', href: '/masterlist/professors', icon: null },
        ],
    },
    {
        title: 'Activity Logs',
        href: '/logs',
        icon: ScrollText,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
