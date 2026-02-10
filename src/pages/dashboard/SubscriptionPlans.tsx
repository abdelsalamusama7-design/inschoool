import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Crown,
  Upload,
  Smartphone,
  Building2,
  Layers,
  Pause,
  CalendarSync,
  Headset,
  Users,
  Trophy,
  Coins,
  BookOpen,
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  name_ar: string;
  price: number;
  currency: string;
  duration_days: number;
  max_lessons: number | null;
  features: string[];
}

const PAYMENT_METHODS = [
  { value: 'instapay', label: 'إنستاباي', icon: Building2, instructions: 'حوّل المبلغ على الرقم: 01032320096 ثم ارفع صورة التحويل' },
  { value: 'e_wallet', label: 'المحفظة الإلكترونية', icon: Smartphone, instructions: 'حوّل المبلغ على الرقم: 01227080430 ثم ارفع صورة التحويل' },
];

const featureIconMap: Record<string, typeof Layers> = {
  Level: Layers,
  Levels: Layers,
  Freeze: Pause,
  Reschedule: CalendarSync,
  Customer: Headset,
  Parent: Users,
  Leaderboard: Trophy,
  Coins: Coins,
};

const getFeatureIcon = (feature: string) => {
  for (const [key, Icon] of Object.entries(featureIconMap)) {
    if (feature.includes(key)) return Icon;
  }
  return BookOpen;
};

const getDurationLabel = (days: number) => {
  if (days <= 90) return '3 Months';
  if (days <= 180) return '6 Months';
  return '12 Months';
};

const getSessionCount = (maxLessons: number | null) => {
  return maxLessons ? `${maxLessons} Sessions` : 'Unlimited';
};

interface LinkedStudent {
  id: string;
  full_name: string;
  email: string;
}

const SubscriptionPlans = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Parent-specific state
  const isParent = role === 'parent';
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  useEffect(() => {
    fetchPlans();
    if (user && isParent) {
      fetchLinkedStudents();
    } else if (user) {
      fetchCurrentSubscription(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchCurrentSubscription(selectedStudentId);
    }
  }, [selectedStudentId]);

  const fetchLinkedStudents = async () => {
    const { data: links } = await supabase
      .from('student_parent_links')
      .select('student_id')
      .eq('parent_id', user!.id);

    if (!links || links.length === 0) return;

    const studentIds = links.map(l => l.student_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, email')
      .in('user_id', studentIds);

    if (profiles) {
      const students = profiles.map(p => ({
        id: p.user_id,
        full_name: p.full_name,
        email: p.email,
      }));
      setLinkedStudents(students);
      if (students.length === 1) {
        setSelectedStudentId(students[0].id);
      }
    }
  };

  const fetchPlans = async () => {
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (data) {
      setPlans(data.map((p: any) => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : [],
      })));
    }
    setLoading(false);
  };

  const fetchCurrentSubscription = async (userId: string) => {
    const { data } = await supabase
      .from('subscriptions')
      .select('plan_id, status')
      .eq('user_id', userId)
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    setCurrentPlan(data ? data.plan_id : null);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan || !user) return;

    const targetUserId = isParent ? selectedStudentId : user.id;

    if (isParent && !targetUserId) {
      toast({ title: 'اختر الطالب أولاً', variant: 'destructive' });
      return;
    }

    if (!paymentMethod) {
      toast({ title: 'اختر طريقة الدفع', variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);

      const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: targetUserId,
          plan_id: selectedPlan.id,
          status: 'pending',
        })
        .select()
        .single();

      if (subError) throw subError;

      let screenshotUrl = null;
      if (screenshot) {
        const filePath = `${user.id}/${Date.now()}_${screenshot.name}`;
        const { error: uploadError } = await supabase.storage
          .from('payment-screenshots')
          .upload(filePath, screenshot);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('payment-screenshots')
          .getPublicUrl(filePath);

        screenshotUrl = urlData.publicUrl;
      }

      const { error: payError } = await supabase.from('payment_requests').insert({
        user_id: targetUserId,
        subscription_id: sub.id,
        plan_id: selectedPlan.id,
        payment_method: paymentMethod,
        amount: selectedPlan.price,
        screenshot_url: screenshotUrl,
        reference_number: referenceNumber || null,
      });

      if (payError) throw payError;

      toast({
        title: 'تم إرسال طلب الاشتراك!',
        description: isParent ? 'سيتم مراجعة الدفع وتفعيل اشتراك الطالب قريباً' : 'سيتم مراجعة الدفع وتفعيل اشتراكك قريباً',
      });

      setSelectedPlan(null);
      setPaymentMethod('');
      setReferenceNumber('');
      setScreenshot(null);
      setCurrentPlan(selectedPlan.id);
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const selectedMethodInfo = PAYMENT_METHODS.find(m => m.value === paymentMethod);

  // Find the "best value" plan (12 months)
  const bestValuePlanId = plans.reduce((best, plan) =>
    plan.duration_days > (best?.duration_days || 0) ? plan : best, plans[0]
  )?.id;

  const isQuranPlan = (plan: Plan) => plan.name.toLowerCase().includes('quran');

  return (
    <div className="space-y-6" dir="rtl">
      <div className="text-center">
        <h1 className="text-3xl font-bold">باقات الاشتراك</h1>
        <p className="text-muted-foreground mt-1">
          {isParent ? 'اختر الطالب والباقة المناسبة' : 'اختر الباقة المناسبة لك'}
        </p>
      </div>

      {/* Parent: Student selector */}
      {isParent && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label className="text-base font-semibold">اختر الطالب</Label>
              {linkedStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا يوجد طلاب مرتبطين. اربط طالب أولاً من الداشبورد.</p>
              ) : (
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الطالب" />
                  </SelectTrigger>
                  <SelectContent>
                    {linkedStudents.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{student.full_name}</span>
                          <span className="text-muted-foreground text-xs">({student.email})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isBestValue = plan.id === bestValuePlanId;
          const isQuran = isQuranPlan(plan);

          return (
            <Card
              key={plan.id}
              className={`relative transition-all hover:shadow-lg ${
                isBestValue ? 'border-primary shadow-md ring-2 ring-primary/20' : ''
              } ${isCurrent ? 'border-emerald-500 ring-2 ring-emerald-500/20' : ''}`}
            >
              {isBestValue && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Crown className="w-3 h-3 ml-1" /> Best Value
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-3 pt-6">
                {isQuran && (
                  <p className="text-xs font-semibold text-primary mb-1">for Quran Kareem</p>
                )}
                <CardTitle className="text-xl">{plan.name_ar}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {getDurationLabel(plan.duration_days)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getSessionCount(plan.max_lessons)}
                </p>

                <div className="pt-3">
                  <span className="text-3xl font-bold">{plan.price.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground mr-1">EGP</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2.5">
                  {plan.features.map((feature, i) => {
                    const Icon = getFeatureIcon(feature);
                    return (
                      <li key={i} className="flex items-center gap-2.5 text-sm">
                        <Icon className="w-4 h-4 text-primary shrink-0" />
                        <span>{feature}</span>
                      </li>
                    );
                  })}
                </ul>

                <Button
                  className="w-full"
                  variant={isBestValue ? 'default' : 'outline'}
                  disabled={isCurrent}
                  onClick={() => setSelectedPlan(plan)}
                >
                  {isCurrent ? 'الباقة الحالية' : 'اشترك الآن'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment Dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إتمام الدفع</DialogTitle>
            <DialogDescription>
              {selectedPlan?.name_ar} — المبلغ المطلوب: {selectedPlan?.price.toLocaleString()} جنيه مصري
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex items-center gap-2">
                        <method.icon className="w-4 h-4" />
                        <span>{method.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMethodInfo && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                {selectedMethodInfo.instructions}
              </div>
            )}

            <div className="space-y-2">
              <Label>رقم المرجع / التحويل (اختياري)</Label>
              <Input
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="أدخل رقم المرجع"
              />
            </div>

            <div className="space-y-2">
              <Label>صورة إيصال الدفع</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                  className="hidden"
                  id="screenshot-upload"
                />
                <label htmlFor="screenshot-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {screenshot ? screenshot.name : 'اضغط لرفع صورة الإيصال'}
                  </p>
                </label>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubscribe}
            disabled={submitting || !paymentMethod}
            className="w-full"
          >
            {submitting ? 'جاري الإرسال...' : 'إرسال طلب الاشتراك'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPlans;
