import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, AlertCircle, CheckCircle } from 'lucide-react';

interface Subscription {
  id: string;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  plan: {
    name: string;
    name_ar: string;
    price: number;
    max_lessons: number | null;
  };
}

const SubscriptionStatus = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select(`
          id, status, starts_at, expires_at,
          subscription_plans (name, name_ar, price, max_lessons)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setSubscription({
          id: data.id,
          status: data.status,
          starts_at: data.starts_at,
          expires_at: data.expires_at,
          plan: data.subscription_plans as any,
        });
      }
    } catch {
      // No subscription found
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> نشط</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-200"><AlertCircle className="w-3 h-3 mr-1" /> قيد المراجعة</Badge>;
      case 'expired':
        return <Badge variant="destructive">منتهي</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const daysRemaining = subscription?.expires_at
    ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          الاشتراك الحالي
        </CardTitle>
        {subscription && getStatusBadge(subscription.status)}
      </CardHeader>
      <CardContent>
        {subscription ? (
          <div className="space-y-2">
            <div className="text-2xl font-bold">{subscription.plan.name_ar}</div>
            {subscription.plan.price > 0 && (
              <p className="text-sm text-muted-foreground">{subscription.plan.price} جنيه/شهر</p>
            )}
            {daysRemaining !== null && subscription.status === 'active' && (
              <p className="text-sm text-muted-foreground">
                متبقي {daysRemaining} يوم
              </p>
            )}
            {subscription.plan.max_lessons && (
              <p className="text-xs text-muted-foreground">
                الحد الأقصى: {subscription.plan.max_lessons} دروس
              </p>
            )}
            <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => navigate('/dashboard/subscription')}>
              ترقية الباقة
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">لا يوجد اشتراك حالي</p>
            <Button size="sm" className="w-full" onClick={() => navigate('/dashboard/subscription')}>
              اشترك الآن
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatus;
