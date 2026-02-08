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
} from 'lucide-react';

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

  const getMenuItems = () => {
    const baseItems = [
      { title: 'Dashboard', icon: Home, url: '/dashboard' },
    ];

    if (role === 'student') {
      return [
        ...baseItems,
        { title: 'My Courses', icon: BookOpen, url: '/dashboard/courses' },
        { title: 'Subscription', icon: Crown, url: '/dashboard/subscription' },
        { title: 'Schedule', icon: Calendar, url: '/dashboard/schedule' },
        { title: 'Progress', icon: BarChart3, url: '/dashboard/progress' },
      ];
    }

    if (role === 'parent') {
      return [
        ...baseItems,
        { title: 'My Student', icon: Users, url: '/dashboard/student' },
        { title: 'Progress', icon: BarChart3, url: '/dashboard/progress' },
      ];
    }

    if (role === 'instructor') {
      return [
        ...baseItems,
        { title: 'My Courses', icon: BookOpen, url: '/dashboard/courses' },
        { title: 'Create Course', icon: Plus, url: '/dashboard/courses/new' },
        { title: 'Lessons', icon: List, url: '/dashboard/lessons' },
        { title: 'Students', icon: Users, url: '/dashboard/students' },
        { title: 'Subscriptions', icon: CreditCard, url: '/dashboard/admin/subscriptions' },
        { title: 'Schedule', icon: Calendar, url: '/dashboard/schedule' },
      ];
    }

    return baseItems;
  };

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
