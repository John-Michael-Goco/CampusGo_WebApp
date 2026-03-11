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
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

function getQuestSubItemsAdmin(pendingApprovalCount?: number): Array<{ title: string; href: string; icon: null; badge?: number }> {
    return [
        { title: 'Active', href: '/quests/active', icon: null },
        { title: 'Approval', href: '/quests/approval', icon: null, ...(pendingApprovalCount != null && pendingApprovalCount > 0 ? { badge: pendingApprovalCount } : {}) },
        { title: 'History', href: '/quests/history', icon: null },
    ];
}

const questSubItemsProfessor: Array<{ title: string; href: string; icon: null }> = [
    { title: 'Active', href: '/quests/active', icon: null },
    { title: 'Approval', href: '/quests/created', icon: null },
    { title: 'History', href: '/quests/history', icon: null },
];

function buildStudentNavItems(): NavItem[] {
    return [
        { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
        { title: 'Leaderboards', href: '/leaderboards', icon: Trophy },
        { title: 'Quests', href: '/quests/active', icon: ScrollText },
        {
            title: 'Store & Achievements',
            href: '/store',
            icon: ShoppingBag,
            items: [
                { title: 'Store', href: '/store', icon: null },
                { title: 'Achievements', href: '/achievements', icon: null },
            ],
        },
    ];
}

function buildMainNavItems(isAdmin: boolean, canSeeQuestHistory: boolean, pendingApprovalCount?: number): NavItem[] {
    const adminItems = getQuestSubItemsAdmin(pendingApprovalCount);
    const filteredAdmin = canSeeQuestHistory ? adminItems : adminItems.filter((s) => s.title !== 'History');
    const professorItems = canSeeQuestHistory ? questSubItemsProfessor : questSubItemsProfessor.filter((s) => s.title !== 'History');
    const questItems = isAdmin ? filteredAdmin : professorItems;

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
    const auth = (usePage().props as { auth?: { isAdmin?: boolean; isStudent?: boolean; canSeeQuestHistory?: boolean; pendingApprovalCount?: number } }).auth;
    const isStudent = auth?.isStudent ?? false;
    const canSeeQuestHistory = auth?.canSeeQuestHistory ?? false;
    const mainNavItems = isStudent
        ? buildStudentNavItems()
        : buildMainNavItems(auth?.isAdmin ?? false, canSeeQuestHistory, auth?.pendingApprovalCount);

    return (
        <Sidebar collapsible="icon" variant="inset" className="border-r border-sidebar-border/80">
            <SidebarHeader className="border-b border-sidebar-border/80 bg-sidebar-accent/30 pb-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="rounded-xl hover:bg-sidebar-accent/60">
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-1">
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border/80 bg-sidebar-accent/20 pt-2">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
