import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, MessageCircle, LogOut, Mail } from 'lucide-react';

const ADMIN_WHATSAPP = '201107157075';
const ADMIN_EMAIL = 'admin@instatech.academy';

const NoRoleAssigned = () => {
  const { user, profile, signOut } = useAuth();

  const message = encodeURIComponent(
    `مرحباً، أنا ${profile?.full_name || user?.email || 'مستخدم جديد'} (${user?.email || ''}).\nقمت بإنشاء حساب على منصة Instatech Academy ولم يتم تعيين دور (Role) لي بعد. أرجو تفعيل حسابي كطالب / ولي أمر.\nشكراً لكم.`
  );
  const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${message}`;
  const mailUrl = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent('طلب تفعيل حساب')}&body=${message}`;

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="p-8 text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-amber-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">حسابك في انتظار التفعيل</h2>
            <p className="text-muted-foreground">
              لم يتم تعيين دور لحسابك بعد. يرجى التواصل مع إدارة المنصة لتفعيل حسابك وتحديد نوعه (طالب، ولي أمر، أو محاضر).
            </p>
          </div>

          {user?.email && (
            <div className="bg-muted rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">البريد المسجل</p>
              <p className="font-medium">{user.email}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild className="flex-1 bg-green-600 hover:bg-green-700 text-white">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4 ml-2" />
                واتساب الإدارة
              </a>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <a href={mailUrl}>
                <Mail className="w-4 h-4 ml-2" />
                بريد الإدارة
              </a>
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل خروج
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NoRoleAssigned;
