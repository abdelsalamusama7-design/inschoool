import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Search, Pencil, Trash2, KeyRound, Users, ShieldCheck } from 'lucide-react';

interface UserData {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [saving, setSaving] = useState(false);

  // Password dialog
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserData | null>(null);

  useEffect(() => {
    if (user) fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, created_at')
        .order('created_at', { ascending: false });

      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (profiles && roles) {
        const roleMap = new Map(roles.map(r => [r.user_id, r.role]));
        const combined: UserData[] = profiles.map(p => ({
          ...p,
          role: roleMap.get(p.user_id) || 'unknown',
        }));
        setUsers(combined);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const invokeManageUser = async (body: any) => {
    const { data, error } = await supabase.functions.invoke('manage-user', { body });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const handleEdit = (u: UserData) => {
    setEditUser(u);
    setEditName(u.full_name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await invokeManageUser({
        action: 'update_profile',
        user_id: editUser.user_id,
        updates: { full_name: editName, email: editEmail },
      });

      if (editRole !== editUser.role) {
        await invokeManageUser({
          action: 'update_role',
          user_id: editUser.user_id,
          updates: { role: editRole },
        });
      }

      toast.success('تم تحديث المستخدم بنجاح');
      setEditOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!passwordUser || newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    setSaving(true);
    try {
      await invokeManageUser({
        action: 'reset_password',
        user_id: passwordUser.user_id,
        updates: { password: newPassword },
      });
      toast.success('تم تغيير كلمة المرور بنجاح');
      setPasswordOpen(false);
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setSaving(true);
    try {
      await invokeManageUser({
        action: 'delete',
        user_id: deleteUser.user_id,
      });
      toast.success('تم حذف المستخدم بنجاح');
      setDeleteOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      admin: 'bg-red-100 text-red-700 border-red-200',
      instructor: 'bg-green-100 text-green-700 border-green-200',
      student: 'bg-blue-100 text-blue-700 border-blue-200',
      parent: 'bg-orange-100 text-orange-700 border-orange-200',
    };
    const labels: Record<string, string> = {
      admin: 'أدمن',
      instructor: 'محاضر',
      student: 'طالب',
      parent: 'ولي أمر',
    };
    return (
      <Badge variant="outline" className={variants[role] || ''}>
        {labels[role] || role}
      </Badge>
    );
  };

  const filtered = users.filter(u => {
    const matchSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            إدارة المستخدمين
          </h1>
          <p className="text-muted-foreground">عرض وتعديل وحذف جميع المستخدمين</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {users.length} مستخدم
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو البريد الإلكتروني..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="فلترة بالدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="student">طالب</SelectItem>
                <SelectItem value="parent">ولي أمر</SelectItem>
                <SelectItem value="instructor">محاضر</SelectItem>
                <SelectItem value="admin">أدمن</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">البريد الإلكتروني</TableHead>
                <TableHead className="text-right">الدور</TableHead>
                <TableHead className="text-right">تاريخ التسجيل</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    لا يوجد مستخدمين
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell>{new Date(u.created_at).toLocaleDateString('ar-EG')}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(u)} title="تعديل">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setPasswordUser(u); setPasswordOpen(true); }} title="تغيير كلمة المرور">
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { setDeleteUser(u); setDeleteOpen(true); }} title="حذف">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المستخدم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>الاسم الكامل</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>الدور</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">طالب</SelectItem>
                  <SelectItem value="parent">ولي أمر</SelectItem>
                  <SelectItem value="instructor">محاضر</SelectItem>
                  <SelectItem value="admin">أدمن</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغيير كلمة المرور - {passwordUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>كلمة المرور الجديدة</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
              />
            </div>
            <Button className="w-full" onClick={handleResetPassword} disabled={saving}>
              {saving ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد حذف المستخدم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              هل أنت متأكد من حذف المستخدم <strong>{deleteUser?.full_name}</strong> ({deleteUser?.email})؟
              <br />
              <span className="text-destructive font-medium">هذا الإجراء لا يمكن التراجع عنه.</span>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteOpen(false)}>
                إلغاء
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={saving}>
                {saving ? 'جاري الحذف...' : 'حذف المستخدم'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
