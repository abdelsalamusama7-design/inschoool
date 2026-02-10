import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  BarChart3,
  Users,
  LogOut,
  Home,
  Plus,
  List,
  Crown,
  CreditCard,
  Sparkles,
  FlaskConical,
  Code2,
  Blocks,
  Terminal,
  Gamepad2,
  ChevronDown,
  Trophy,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface MenuItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  url: string;
}

interface LabItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  url: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getMenuItems = (): MenuItem[] => {
    const baseItems: MenuItem[] = [
      { title: 'Dashboard', icon: Home, url: '/dashboard' },
    ];

    if (role === 'student') {
      return [
        ...baseItems,
        { title: 'My Courses', icon: BookOpen, url: '/dashboard/courses' },
        { title: 'Subscription', icon: Crown, url: '/dashboard/subscription' },
        { title: 'Schedule', icon: Calendar, url: '/dashboard/schedule' },
        { title: 'Progress', icon: BarChart3, url: '/dashboard/progress' },
        { title: 'Leaderboard', icon: Trophy, url: '/dashboard/leaderboard' },
      ];
    }

    if (role === 'parent') {
      return [
        ...baseItems,
        { title: 'My Student', icon: Users, url: '/dashboard/student' },
        { title: 'Progress', icon: BarChart3, url: '/dashboard/progress' },
        { title: 'Leaderboard', icon: Trophy, url: '/dashboard/leaderboard' },
      ];
    }

    if (role === 'instructor') {
      return [
        ...baseItems,
        { title: 'My Courses', icon: BookOpen, url: '/dashboard/courses' },
        { title: 'Create Course', icon: Plus, url: '/dashboard/courses/new' },
        { title: 'Generate Lessons', icon: Sparkles, url: '/dashboard/curriculum-generator' },
        { title: 'Lessons', icon: List, url: '/dashboard/lessons' },
        { title: 'Students', icon: Users, url: '/dashboard/students' },
        { title: 'Subscriptions', icon: CreditCard, url: '/dashboard/admin/subscriptions' },
        { title: 'Schedule', icon: Calendar, url: '/dashboard/schedule' },
      ];
    }

    return baseItems;
  };

  const getLabItems = (): LabItem[] => {
    if (role === 'student' || role === 'instructor') {
      return [
        { title: 'Scratch Lab', icon: Code2, url: '/dashboard/labs/scratch' },
        { title: 'Python Lab', icon: Terminal, url: '/dashboard/labs/python' },
        { title: 'Roblox Lab', icon: Gamepad2, url: '/dashboard/labs/roblox' },
        { title: 'Minecraft Coding', icon: Blocks, url: '/dashboard/labs/minecraft' },
      ];
    }
    return [];
  };

  const labItems = getLabItems();
  const menuItems = getMenuItems();
  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  const getRoleLabel = () => {
    switch (role) {
      case 'student': return 'Student';
      case 'parent': return 'Parent';
      case 'instructor': return 'Instructor';
      default: return 'User';
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg">In School</h1>
                <p className="text-xs text-muted-foreground">{getRoleLabel()} Dashboard</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        onClick={() => navigate(item.url)}
                        isActive={window.location.pathname === item.url}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {labItems.length > 0 && (
              <SidebarGroup>
                <Collapsible defaultOpen={window.location.pathname.startsWith('/dashboard/labs')}>
                  <CollapsibleTrigger className="w-full">
                    <SidebarGroupLabel className="flex items-center justify-between w-full cursor-pointer hover:text-foreground transition-colors">
                      <span className="flex items-center gap-2">
                        <FlaskConical className="w-3.5 h-3.5" />
                        Labs
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {labItems.map((lab) => (
                          <SidebarMenuItem key={lab.title}>
                            <SidebarMenuButton
                              onClick={() => navigate(lab.url)}
                              isActive={window.location.pathname === lab.url}
                            >
                              <lab.icon className="w-4 h-4" />
                              <span>{lab.title}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>
            )}
          </SidebarContent>
          
          <SidebarFooter className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </SidebarFooter>
        </Sidebar>
        
        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center px-4 gap-4">
            <SidebarTrigger />
          </header>
          <div className="flex-1 p-6 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
