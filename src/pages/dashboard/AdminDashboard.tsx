import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Users,
  BookOpen,
  CreditCard,
  GraduationCap,
  ShieldCheck,
  UserPlus,
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
    totalStudents: 0,
    totalInstructors: 0,
    totalParents: 0,
    totalAdmins: 0,
    totalCourses: 0,
    totalSubscriptions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [creating, setCreating] = useState(false);

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

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail || !newAdminPassword || !newAdminName) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    if (newAdminPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setCreating(true);
    try {
      // Sign up the new admin
      const { data, error } = await supabase.auth.signUp({
        email: newAdminEmail,
        password: newAdminPassword,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Failed to create user');

      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: data.user.id,
        full_name: newAdminName,
        email: newAdminEmail,
      });
      if (profileError) throw profileError;

      // Create admin role
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: 'admin' as any,
      });
      if (roleError) throw roleError;

      toast.success('تم إنشاء حساب الأدمن بنجاح!');
      setDialogOpen(false);
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminName('');
      fetchStats();
    } catch (error: any) {
      if (error.message?.includes('already registered')) {
        toast.error('هذا البريد الإلكتروني مسجل بالفعل');
      } else {
        toast.error(error.message || 'حدث خطأ أثناء إنشاء الحساب');
      }
    } finally {
      setCreating(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">لوحة تحكم الأدمن</h1>
          <p className="text-muted-foreground">مرحباً! لديك صلاحيات كاملة للتحكم في المنصة</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              إنشاء حساب أدمن جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء حساب أدمن جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="space-y-2">
                <Label>الاسم الكامل</Label>
                <Input
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="أدخل الاسم الكامل"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="أدخل البريد الإلكتروني"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>كلمة المرور</Label>
                <Input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور (6 أحرف على الأقل)"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? 'جاري الإنشاء...' : 'إنشاء حساب الأدمن'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
