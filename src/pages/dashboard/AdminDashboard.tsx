import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CreateUserDialog from '@/components/dashboard/CreateUserDialog';
import {
  Users,
  BookOpen,
  CreditCard,
  GraduationCap,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';

interface Stats {
  totalStudents: number;
  totalInstructors: number;
  totalParents: number;
  totalAdmins: number;
  totalCourses: number;
  totalSubscriptions: number;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0, totalInstructors: 0, totalParents: 0,
    totalAdmins: 0, totalCourses: 0, totalSubscriptions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const [
        { count: studentCount },
        { count: instructorCount },
        { count: parentCount },
        { count: adminCount },
        { count: courseCount },
        { count: subCount },
      ] = await Promise.all([
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'instructor'),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'parent'),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      ]);

      setStats({
        totalStudents: studentCount || 0,
        totalInstructors: instructorCount || 0,
        totalParents: parentCount || 0,
        totalAdmins: adminCount || 0,
        totalCourses: courseCount || 0,
        totalSubscriptions: subCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  const statCards = [
    { title: 'الطلاب', value: stats.totalStudents, icon: GraduationCap, color: 'text-blue-600' },
    { title: 'المحاضرين', value: stats.totalInstructors, icon: BookOpen, color: 'text-green-600' },
    { title: 'أولياء الأمور', value: stats.totalParents, icon: Users, color: 'text-orange-600' },
    { title: 'الأدمن', value: stats.totalAdmins, icon: ShieldCheck, color: 'text-red-600' },
    { title: 'الدورات', value: stats.totalCourses, icon: BarChart3, color: 'text-purple-600' },
    { title: 'الاشتراكات النشطة', value: stats.totalSubscriptions, icon: CreditCard, color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold">لوحة تحكم الأدمن</h1>
          <p className="text-muted-foreground">مرحباً! لديك صلاحيات كاملة للتحكم في المنصة</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CreateUserDialog role="student" onCreated={fetchStats} />
          <CreateUserDialog role="parent" onCreated={fetchStats} />
          <CreateUserDialog role="instructor" onCreated={fetchStats} />
          <CreateUserDialog role="admin" onCreated={fetchStats} variant="default" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
