import { Star } from "lucide-react";

const StatsSection = () => {
  const stats = [
    { value: "+130,000", label: "خريج", suffix: "طالب" },
    { value: "+6,000,000", label: "ساعة تعليمية", suffix: "ساعة" },
    { value: "+250,000", label: "ولي أمر سعيد", suffix: "" },
    { value: "4.9/5", label: "متوسط تقييم الطلاب", suffix: "", isRating: true },
  ];

  return (
    <section className="gradient-primary py-16">
      <div className="container mx-auto">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center text-primary-foreground"
            >
              <div className="mb-2 text-4xl font-extrabold md:text-5xl">
                {stat.value}
              </div>
              <div className="flex items-center gap-2 text-lg opacity-90">
                {stat.isRating && (
                  <Star className="h-5 w-5 fill-secondary text-secondary" />
                )}
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
