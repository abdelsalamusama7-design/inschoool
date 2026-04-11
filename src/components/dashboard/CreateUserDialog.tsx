import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';

interface CreateUserDialogProps {
  role: 'admin' | 'instructor' | 'student' | 'parent';
  onCreated?: () => void;
  variant?: 'default' | 'outline';
}

const roleLabels: Record<string, { button: string; title: string; success: string }> = {
  admin: { button: 'إنشاء حساب أدمن', title: 'إنشاء حساب أدمن جديد', success: 'تم إنشاء حساب الأدمن بنجاح!' },
  instructor: { button: 'إنشاء حساب محاضر', title: 'إنشاء حساب محاضر جديد', success: 'تم إنشاء حساب المحاضر بنجاح!' },
  student: { button: 'إنشاء حساب طالب', title: 'إنشاء حساب طالب جديد', success: 'تم إنشاء حساب الطالب بنجاح!' },
  parent: { button: 'إنشاء حساب ولي أمر', title: 'إنشاء حساب ولي أمر جديد', success: 'تم إنشاء حساب ولي الأمر بنجاح!' },
};

const CreateUserDialog = ({ role, onCreated, variant = 'outline' }: CreateUserDialogProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [creating, setCreating] = useState(false);

  const labels = roleLabels[role];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-admin', {
        body: { email, password, full_name: fullName, role },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(labels.success);
      setOpen(false);
      setEmail('');
      setPassword('');
      setFullName('');
      onCreated?.();
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size="sm">
          <UserPlus className="w-4 h-4 mr-2" />
          {labels.button}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>الاسم الكامل</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="أدخل الاسم الكامل" required />
          </div>
          <div className="space-y-2">
            <Label>البريد الإلكتروني</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="أدخل البريد الإلكتروني" required />
          </div>
          <div className="space-y-2">
            <Label>كلمة المرور</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="أدخل كلمة المرور (6 أحرف على الأقل)" required />
          </div>
          <Button type="submit" className="w-full" disabled={creating}>
            {creating ? 'جاري الإنشاء...' : labels.button}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
