import { BookOpen, Video, Users, TrendingUp } from "lucide-react";

const WhySection = () => {
  const reasons = [
    {
      icon: BookOpen,
      title: "منهج STEM والذكاء الاصطناعي المعتمد",
      description: "يتعلم الطلاب البرمجة باستخدام نفس المنصات التي يستخدمها المحترفون",
    },
    {
      icon: Video,
      title: "حصص مباشرة أونلاين",
      description: "حصص فردية 1:1 مع مدربين متخصصين من راحة المنزل",
    },
    {
      icon: Users,
      title: "أفضل معلمي علوم الحاسب",
      description: "من جميع أنحاء العالم، مدربون على تعليم البرمجة بالعربية والإنجليزية",
    },
    {
      icon: TrendingUp,
      title: "خطة مهنية تقنية طويلة المدى",
      description: "تتبع تقدم طفلك ومستقبله التقني مع تقارير وملاحظات على كل حصة",
    },
  ];

  return (
    <section id="why" className="bg-muted/30 py-20">
      <div className="container mx-auto">
        <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
          لماذا <span className="text-primary">In School</span>؟
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {reasons.map((reason, index) => (
            <div
              key={index}
              className="group flex gap-6 rounded-2xl bg-card p-8 shadow-soft transition-all duration-300 hover:shadow-card"
            >
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary">
                <reason.icon className="h-8 w-8 text-primary transition-colors group-hover:text-primary-foreground" />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-bold">{reason.title}</h3>
                <p className="text-muted-foreground">{reason.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhySection;
