import { Link, usePage } from '@inertiajs/react';
import {
    GraduationCap,
    LayoutGrid,
    Receipt,
    ScrollText,
    ShoppingBag,
    Trophy,
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

const questSubItemsAdmin: Array<{ title: string; href: string; icon: null }> = [
    { title: 'Active', href: '/quests/active', icon: null },
    { title: 'Approval', href: '/quests/approval', icon: null },
    { title: 'History', href: '/quests/history', icon: null },
];

const questSubItemsProfessor: Array<{ title: string; href: string; icon: null }> = [
    { title: 'Active', href: '/quests/active', icon: null },
    { title: 'History', href: '/quests/history', icon: null },
];

function buildMainNavItems(isAdmin: boolean): NavItem[] {
    const questItems = isAdmin ? questSubItemsAdmin : questSubItemsProfessor;

    return [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: 'Users',
            href: '/users',
            icon: Users,
        },
        {
            title: 'Leaderboards',
            href: '/leaderboards',
            icon: Trophy,
        },
        {
            title: 'Quests',
            href: '/quests/active',
            icon: ScrollText,
            items: questItems,
        },
        {
            title: 'Store & Achievements',
            href: '/store',
            icon: ShoppingBag,
            items: [
                { title: 'Store', href: '/store', icon: null },
                { title: 'Achievements', href: '/achievements', icon: null },
            ],
        },
        {
            title: 'Academic Management',
            href: '/masterlist/students',
            icon: GraduationCap,
            items: [
                { title: 'Students', href: '/masterlist/students', icon: null },
                { title: 'Professors', href: '/masterlist/professors', icon: null },
                { title: 'Semester', href: '/semesters', icon: null },
            ],
        },
        {
            title: 'Logs and Transactions',
            href: '/logs',
            icon: Receipt,
            items: [
                { title: 'Activity Logs', href: '/logs', icon: null },
                { title: 'Points Transactions', href: '/transactions', icon: null },
            ],
        },
    ];
}

export function AppSidebar() {
    const auth = (usePage().props as { auth?: { isAdmin?: boolean } }).auth;
    const mainNavItems = buildMainNavItems(auth?.isAdmin ?? false);

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
