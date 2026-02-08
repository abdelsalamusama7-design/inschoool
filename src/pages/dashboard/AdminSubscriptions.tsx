import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Eye, Users, CreditCard, AlertCircle } from 'lucide-react';

interface PaymentRequest {
  id: string;
  user_id: string;
  subscription_id: string | null;
  plan_id: string;
  payment_method: string;
  amount: number;
  screenshot_url: string | null;
  reference_number: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  profile?: { full_name: string; email: string } | null;
  plan?: { name_ar: string } | null;
}

interface SubscriptionRow {
  id: string;
  user_id: string;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  profile?: { full_name: string; email: string } | null;
  plan?: { name_ar: string; price: number } | null;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  vodafone_cash: 'فودافون كاش',
  instapay: 'إنستاباي',
  fawry: 'فوري',
};

const AdminSubscriptions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch payment requests
      const { data: paymentData } = await supabase
        .from('payment_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch subscriptions
      const { data: subData } = await supabase
        .from('subscriptions')
        .select(`*, subscription_plans (name_ar, price)`)
        .order('created_at', { ascending: false });

      // Fetch profiles for all user IDs
      const allUserIds = [
        ...(paymentData || []).map((p: any) => p.user_id),
        ...(subData || []).map((s: any) => s.user_id),
      ];
      const uniqueUserIds = [...new Set(allUserIds)];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', uniqueUserIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.user_id, { full_name: p.full_name, email: p.email }])
      );

      // Fetch plan names for payments
      const planIds = [...new Set((paymentData || []).map((p: any) => p.plan_id))];
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('id, name_ar')
        .in('id', planIds);

      const planMap = new Map(
        (plansData || []).map((p: any) => [p.id, { name_ar: p.name_ar }])
      );

      if (paymentData) {
        setPayments(paymentData.map((p: any) => ({
          ...p,
          profile: profileMap.get(p.user_id) || null,
          plan: planMap.get(p.plan_id) || null,
        })));
      }

      if (subData) {
        setSubscriptions(subData.map((s: any) => ({
          ...s,
          profile: profileMap.get(s.user_id) || null,
          plan: s.subscription_plans,
        })));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (payment: PaymentRequest) => {
    setProcessing(true);
    try {
      // Update payment status
      const { error: payError } = await supabase
        .from('payment_requests')
        .update({
          status: 'approved',
          admin_notes: adminNotes || null,
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      if (payError) throw payError;

      // Activate subscription
      if (payment.subscription_id) {
        const { error: subError } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            starts_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
          })
          .eq('id', payment.subscription_id);

        if (subError) throw subError;
      }

      toast({ title: 'تم قبول الدفع وتفعيل الاشتراك' });
      setSelectedPayment(null);
      setAdminNotes('');
      fetchData();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectPayment = async (payment: PaymentRequest) => {
    setProcessing(true);
    try {
      const { error: payError } = await supabase
        .from('payment_requests')
        .update({
          status: 'rejected',
          admin_notes: adminNotes || 'تم رفض الطلب',
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      if (payError) throw payError;

      if (payment.subscription_id) {
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('id', payment.subscription_id);
      }

      toast({ title: 'تم رفض طلب الدفع' });
      setSelectedPayment(null);
      setAdminNotes('');
      fetchData();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleSubscription = async (sub: SubscriptionRow) => {
    const newStatus = sub.status === 'active' ? 'cancelled' : 'active';
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'active') {
        updates.starts_at = new Date().toISOString();
        updates.expires_at = new Date(Date.now() + 30 * 86400000).toISOString();
      }

      const { error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', sub.id);

      if (error) throw error;

      toast({ title: newStatus === 'active' ? 'تم تفعيل الاشتراك' : 'تم إلغاء الاشتراك' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500/10 text-green-600 border-green-200">نشط</Badge>;
      case 'pending': return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200">قيد المراجعة</Badge>;
      case 'approved': return <Badge className="bg-green-500/10 text-green-600 border-green-200">مقبول</Badge>;
      case 'rejected': return <Badge variant="destructive">مرفوض</Badge>;
      case 'expired': return <Badge variant="secondary">منتهي</Badge>;
      case 'cancelled': return <Badge variant="outline">ملغي</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingPayments = payments.filter(p => p.status === 'pending').length;

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold">إدارة الاشتراكات</h1>
        <p className="text-muted-foreground">إدارة اشتراكات الطلاب ومراجعة المدفوعات</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الاشتراكات</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">اشتراكات نشطة</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions.filter(s => s.status === 'active').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">مدفوعات بانتظار المراجعة</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingPayments}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            المدفوعات
            {pendingPayments > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0">{pendingPayments}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            الاشتراكات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الطالب</TableHead>
                    <TableHead className="text-right">الباقة</TableHead>
                    <TableHead className="text-right">طريقة الدفع</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        لا توجد مدفوعات
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.profile?.full_name || 'غير معروف'}</p>
                            <p className="text-xs text-muted-foreground">{payment.profile?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{payment.plan?.name_ar || '-'}</TableCell>
                        <TableCell>{PAYMENT_METHOD_LABELS[payment.payment_method] || payment.payment_method}</TableCell>
                        <TableCell>{payment.amount} جنيه</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-sm">{new Date(payment.created_at).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => { setSelectedPayment(payment); setAdminNotes(''); }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الطالب</TableHead>
                    <TableHead className="text-right">الباقة</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">تاريخ البدء</TableHead>
                    <TableHead className="text-right">تاريخ الانتهاء</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        لا توجد اشتراكات
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{sub.profile?.full_name || 'غير معروف'}</p>
                            <p className="text-xs text-muted-foreground">{sub.profile?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{sub.plan?.name_ar || '-'}</TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell className="text-sm">
                          {sub.starts_at ? new Date(sub.starts_at).toLocaleDateString('ar-EG') : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('ar-EG') : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={sub.status === 'active' ? 'destructive' : 'default'}
                            onClick={() => handleToggleSubscription(sub)}
                          >
                            {sub.status === 'active' ? 'إلغاء' : 'تفعيل'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Detail Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل الدفع</DialogTitle>
            <DialogDescription>
              مراجعة طلب الدفع من {selectedPayment?.profile?.full_name}
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">الطالب</p>
                  <p className="font-medium">{selectedPayment.profile?.full_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">البريد</p>
                  <p className="font-medium">{selectedPayment.profile?.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">الباقة</p>
                  <p className="font-medium">{selectedPayment.plan?.name_ar}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">المبلغ</p>
                  <p className="font-medium">{selectedPayment.amount} جنيه</p>
                </div>
                <div>
                  <p className="text-muted-foreground">طريقة الدفع</p>
                  <p className="font-medium">{PAYMENT_METHOD_LABELS[selectedPayment.payment_method]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">رقم المرجع</p>
                  <p className="font-medium">{selectedPayment.reference_number || '-'}</p>
                </div>
              </div>

              {selectedPayment.screenshot_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">صورة الإيصال</p>
                  <img
                    src={selectedPayment.screenshot_url}
                    alt="Payment screenshot"
                    className="w-full rounded-lg border max-h-64 object-contain"
                  />
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">ملاحظات الإدارة</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="أضف ملاحظة (اختياري)"
                  rows={2}
                />
              </div>

              {selectedPayment.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => handleApprovePayment(selectedPayment)}
                    disabled={processing}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    قبول وتفعيل
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleRejectPayment(selectedPayment)}
                    disabled={processing}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    رفض
                  </Button>
                </div>
              )}

              {selectedPayment.status !== 'pending' && (
                <div className="text-center">
                  {getStatusBadge(selectedPayment.status)}
                  {selectedPayment.admin_notes && (
                    <p className="text-sm text-muted-foreground mt-2">{selectedPayment.admin_notes}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubscriptions;
