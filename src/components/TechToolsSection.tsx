import { 
  Smartphone, 
  Brain, 
  Gamepad2, 
  Code2, 
  Blocks, 
  Globe, 
  Palette, 
  Box 
} from "lucide-react";

const TechToolsSection = () => {
  const tools = [
    { icon: Smartphone, name: "تطوير تطبيقات الموبايل", color: "bg-blue-light text-primary" },
    { icon: Brain, name: "الذكاء الاصطناعي والتعلم الآلي", color: "bg-orange-light text-secondary" },
    { icon: Box, name: "البرمجة ثلاثية الأبعاد (AR, VR)", color: "bg-blue-light text-primary" },
    { icon: Gamepad2, name: "تطوير الألعاب", color: "bg-orange-light text-secondary" },
    { icon: Code2, name: "Python وعلوم البيانات", color: "bg-blue-light text-primary" },
    { icon: Blocks, name: "ماينكرافت", color: "bg-orange-light text-secondary" },
    { icon: Globe, name: "تطوير المواقع", color: "bg-blue-light text-primary" },
    { icon: Palette, name: "واجهة المستخدم (UI & UX)", color: "bg-orange-light text-secondary" },
  ];

  return (
    <section className="bg-muted/50 py-16">
      <div className="container mx-auto">
        <h2 className="mb-12 text-center text-2xl font-bold text-foreground md:text-3xl">
          <span className="text-secondary">+48</span> أداة تقنية احترافية في منهج واحد
        </h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {tools.map((tool, index) => (
            <div
              key={index}
              className="group flex flex-col items-center gap-3 rounded-2xl bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
            >
              <div className={`rounded-xl p-3 ${tool.color} transition-transform group-hover:scale-110`}>
                <tool.icon className="h-6 w-6" />
              </div>
              <span className="text-center text-xs font-medium text-muted-foreground">
                {tool.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechToolsSection;
