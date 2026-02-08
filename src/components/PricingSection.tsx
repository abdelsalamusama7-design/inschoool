import { Check, Rocket, Globe, Telescope, BookOpen, Pause, CalendarSync, Headset, Users, Trophy, Coins, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PricingSection = () => {
  const navigate = useNavigate();

  const plans = [
    {
      icon: Telescope,
      iconBg: "bg-blue-light",
      title: "3 أشهر",
      sessions: "12 حصة",
      price: "3300",
      badge: null,
      features: [
        { icon: Layers, text: "1 مستوى" },
        { icon: Pause, text: "2 رصيد تجميد" },
        { icon: CalendarSync, text: "2 رصيد إعادة جدولة" },
        { icon: Headset, text: "دعم العملاء" },
        { icon: Coins, text: "اكسب 1000 كوينز" },
      ],
    },
    {
      icon: Globe,
      iconBg: "bg-orange-light",
      title: "6 أشهر",
      sessions: "24 حصة",
      price: "6300",
      badge: null,
      features: [
        { icon: Layers, text: "2 مستوى" },
        { icon: Pause, text: "6 رصيد تجميد" },
        { icon: CalendarSync, text: "6 رصيد إعادة جدولة" },
        { icon: Headset, text: "دعم العملاء" },
        { icon: Users, text: "دعم أولياء الأمور" },
        { icon: Coins, text: "اكسب 4000 كوينز" },
      ],
    },
    {
      icon: Rocket,
      iconBg: "bg-blue-light",
      title: "12 شهر",
      sessions: "48 حصة",
      price: "12300",
      badge: "الأفضل قيمة",
      features: [
        { icon: Layers, text: "4 مستويات" },
        { icon: Pause, text: "12 رصيد تجميد" },
        { icon: CalendarSync, text: "16 رصيد إعادة جدولة" },
        { icon: Headset, text: "دعم العملاء" },
        { icon: Users, text: "دعم أولياء الأمور" },
        { icon: Trophy, text: "لوحة المتصدرين الكاملة" },
        { icon: Coins, text: "اكسب 10000 كوينز" },
      ],
    },
    {
      icon: BookOpen,
      iconBg: "bg-blue-light",
      title: "3 أشهر",
      sessions: "24 حصة",
      price: "3300",
      badge: null,
      isQuran: true,
      features: [
        { icon: Layers, text: "2 مستوى" },
        { icon: Pause, text: "6 رصيد تجميد" },
        { icon: CalendarSync, text: "6 رصيد إعادة جدولة" },
        { icon: Headset, text: "دعم العملاء" },
        { icon: Users, text: "دعم أولياء الأمور" },
        { icon: Coins, text: "اكسب 4000 كوينز" },
      ],
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="container mx-auto">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            خطط <span className="text-gradient">الأسعار</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            اختر الخطة المناسبة لطفلك وابدأ رحلة التعلم اليوم
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className="relative overflow-hidden border-2 transition-all duration-300 hover:shadow-card hover:border-primary/30"
            >
              {plan.badge && (
                <Badge className="absolute top-4 left-4 bg-secondary text-secondary-foreground text-xs font-semibold">
                  {plan.badge}
                </Badge>
              )}
              <CardContent className="p-6">
                <div className={`mb-4 inline-flex rounded-xl p-3 ${plan.iconBg}`}>
                  <plan.icon className="h-8 w-8 text-primary" />
                </div>

                {plan.isQuran && (
                  <p className="mb-1 text-sm font-bold text-foreground">
                    لتحفيظ القرآن الكريم
                  </p>
                )}

                <h3 className="text-xl font-bold text-foreground">{plan.title}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{plan.sessions}</p>

                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-sm font-semibold text-secondary">EGP</span>
                </div>

                <ul className="mb-6 space-y-3">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <feature.icon className="h-4 w-4 shrink-0 text-primary" />
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => navigate("/auth")}
                  className="w-full"
                  variant={plan.badge ? "default" : "outline"}
                >
                  احجز الآن
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
