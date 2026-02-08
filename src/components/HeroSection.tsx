import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  const navigate = useNavigate();

  const features = [
    "حصص برمجة مباشرة 1:1 أونلاين للصفوف من 1 إلى 12",
    "منهج معتمد قائم على مشاريع حقيقية",
    "أفضل المدربين من راحة منزلك",
  ];

  return (
    <section className="relative min-h-screen overflow-hidden bg-background pt-20">
      {/* Background decoration */}
      <div className="pointer-events-none absolute left-0 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 right-0 h-96 w-96 rounded-full bg-secondary/5 blur-3xl" />

      <div className="container mx-auto flex min-h-[calc(100vh-5rem)] items-center py-12">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
          {/* Content */}
          <div className="flex flex-col justify-center">
            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              جيل اليوم
              <br />
              <span className="inline-block rounded-full bg-primary px-6 py-2 text-primary-foreground">
                قادة التكنولوجيا
              </span>
              <br />
              في الغد
            </h1>

            <div className="mb-8 flex flex-col gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary" />
                  <span className="text-lg text-muted-foreground">
                    <span className="font-semibold text-primary">
                      {feature.split(" ").slice(0, 2).join(" ")}
                    </span>{" "}
                    {feature.split(" ").slice(2).join(" ")}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="gradient-orange text-lg" asChild>
                <a href="https://docs.google.com/forms/d/e/1FAIpQLScMCHcf05VturMfaIkoCx_cvRZ3YpuBws5pMFdgklog0mUMpA/viewform?usp=header" target="_blank" rel="noopener noreferrer">
                  احجز جلسة مجانية
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-lg">
                اعرف المزيد
              </Button>
            </div>
          </div>

          {/* Image */}
          <div className="relative flex items-center justify-center">
            {/* Decorative circle */}
            <div className="absolute h-[400px] w-[400px] rounded-full border-[20px] border-primary/20 lg:h-[500px] lg:w-[500px]" />
            <div className="absolute right-10 top-10 h-20 w-20 rounded-full bg-secondary lg:h-24 lg:w-24" />
            
            <div className="relative z-10 overflow-hidden rounded-3xl shadow-card">
              <img
                src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=500&fit=crop"
                alt="طلاب يتعلمون البرمجة"
                className="h-auto w-full max-w-md object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
