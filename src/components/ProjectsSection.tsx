import { Button } from "@/components/ui/button";

const ProjectsSection = () => {
  const projects = [
    {
      title: "سيارة الفضاء",
      description: "قيادة سيارة في الفضاء اللامتناهي",
      image: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=300&fit=crop",
    },
    {
      title: "لعبة إطلاق النار الفضائية",
      description: "إنشاء لعبة إطلاق فضائية ثلاثية الأبعاد",
      image: "https://images.unsplash.com/photo-1552820728-8b83bb6b2b0a?w=400&h=300&fit=crop",
    },
    {
      title: "طيران الدرون",
      description: "طيران درون في بيئة ثلاثية الأبعاد مذهلة",
      image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=300&fit=crop",
    },
    {
      title: "لعبة البولينج",
      description: "إنشاء لعبة بولينج في بيئة ثلاثية الأبعاد",
      image: "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=400&h=300&fit=crop",
    },
    {
      title: "الساعة الرقمية",
      description: "بناء ساعة رقمية باستخدام Python",
      image: "https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400&h=300&fit=crop",
    },
    {
      title: "تحليل المشاعر",
      description: "فهم كيف تستوعب الحواسيب المشاعر",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
    },
  ];

  return (
    <section id="projects" className="py-20">
      <div className="container mx-auto">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            اكتشف <span className="text-secondary">+60,000</span> مشروع طلابي
          </h2>
          <p className="text-lg text-muted-foreground">
            استكشف هذه المشاريع من طلاب In School من أكثر من 20 دولة
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <div
              key={index}
              className="group overflow-hidden rounded-2xl bg-card shadow-soft transition-all duration-300 hover:-translate-y-2 hover:shadow-card"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              <div className="p-6">
                <h3 className="mb-2 text-lg font-bold">{project.title}</h3>
                <p className="text-sm text-muted-foreground">{project.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center gap-4">
          <Button size="lg" className="gradient-orange">
            احجز جلسة مجانية
          </Button>
          <Button size="lg" variant="outline">
            شاهد المزيد من المشاريع
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
