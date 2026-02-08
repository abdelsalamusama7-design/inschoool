import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20">
      <div className="container mx-auto">
        <div className="relative overflow-hidden rounded-3xl gradient-primary p-12 text-center md:p-16">
          {/* Decorative elements */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10" />

          <div className="relative z-10">
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">
              ابدأ رحلة طفلك التقنية اليوم
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-foreground/90">
              احجز جلسة تجريبية مجانية واكتشف كيف يمكن لـ In School أن يساعد طفلك في بناء مستقبله التقني
            </p>
            <Button size="lg" className="gradient-orange gap-2 text-lg" asChild>
              <a href="https://docs.google.com/forms/d/e/1FAIpQLScMCHcf05VturMfaIkoCx_cvRZ3YpuBws5pMFdgklog0mUMpA/viewform?usp=header" target="_blank" rel="noopener noreferrer">
                احجز جلسة مجانية الآن
                <ArrowLeft className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
