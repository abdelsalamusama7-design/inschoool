import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Check, Crown, Upload, Smartphone, Building2, CreditCard } from 'lucide-react';

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
  { value: 'vodafone_cash', label: 'فودافون كاش', icon: Smartphone, instructions: 'حوّل المبلغ على الرقم: 01XXXXXXXXX ثم ارفع صورة التحويل' },
  { value: 'instapay', label: 'إنستاباي', icon: Building2, instructions: 'حوّل على حساب: username@instapay ثم ارفع صورة التحويل' },
  { value: 'fawry', label: 'فوري', icon: CreditCard, instructions: 'ادفع برقم المرجع في أي فرع فوري ثم ارفع الإيصال' },
];

const SubscriptionPlans = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPlans();
    if (user) fetchCurrentSubscription();
  }, [user]);

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

  const fetchCurrentSubscription = async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select('plan_id, status')
      .eq('user_id', user!.id)
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) setCurrentPlan(data.plan_id);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan || !user) return;

    // Free plan - subscribe directly
    if (selectedPlan.price === 0) {
      try {
        setSubmitting(true);
        const { error } = await supabase.from('subscriptions').insert({
          user_id: user.id,
          plan_id: selectedPlan.id,
          status: 'active',
          starts_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + selectedPlan.duration_days * 86400000).toISOString(),
        });

        if (error) throw error;

        toast({ title: 'تم الاشتراك بنجاح!', description: 'يمكنك الآن الوصول للدروس المجانية' });
        setSelectedPlan(null);
        setCurrentPlan(selectedPlan.id);
      } catch (error: any) {
        toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Paid plan - require payment
    if (!paymentMethod) {
      toast({ title: 'اختر طريقة الدفع', variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);

      // Create subscription with pending status
      const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_id: selectedPlan.id,
          status: 'pending',
        })
        .select()
        .single();

      if (subError) throw subError;

      // Upload screenshot if provided
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

      // Create payment request
      const { error: payError } = await supabase.from('payment_requests').insert({
        user_id: user.id,
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
        description: 'سيتم مراجعة الدفع وتفعيل اشتراكك قريباً',
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

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold">باقات الاشتراك</h1>
        <p className="text-muted-foreground">اختر الباقة المناسبة لك</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isPremium = plan.name === 'Premium Monthly';

          return (
            <Card
              key={plan.id}
              className={`relative transition-all ${isPremium ? 'border-primary shadow-lg scale-105' : ''} ${isCurrent ? 'border-green-500' : ''}`}
            >
              {isPremium && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Crown className="w-3 h-3 mr-1" /> الأفضل قيمة
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{plan.name_ar}</CardTitle>
                <CardDescription>{plan.name}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    {plan.price === 0 ? 'مجاني' : `${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground mr-1">جنيه/شهر</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.max_lessons && (
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>الحد الأقصى: {plan.max_lessons} دروس</span>
                    </li>
                  )}
                </ul>
                <Button
                  className="w-full"
                  variant={isPremium ? 'default' : 'outline'}
                  disabled={isCurrent}
                  onClick={() => setSelectedPlan(plan)}
                >
                  {isCurrent ? 'الباقة الحالية' : plan.price === 0 ? 'ابدأ مجاناً' : 'اشترك الآن'}
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
            <DialogTitle>
              {selectedPlan?.price === 0 ? 'تأكيد الاشتراك المجاني' : 'إتمام الدفع'}
            </DialogTitle>
            <DialogDescription>
              {selectedPlan?.price === 0
                ? `سيتم تفعيل باقة ${selectedPlan?.name_ar} مباشرة`
                : `المبلغ المطلوب: ${selectedPlan?.price} جنيه مصري`}
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && selectedPlan.price > 0 && (
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
          )}

          <Button
            onClick={handleSubscribe}
            disabled={submitting || (selectedPlan?.price !== 0 && !paymentMethod)}
            className="w-full"
          >
            {submitting ? 'جاري الإرسال...' : selectedPlan?.price === 0 ? 'تفعيل الباقة المجانية' : 'إرسال طلب الاشتراك'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPlans;
