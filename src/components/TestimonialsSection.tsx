import { Star, Quote } from "lucide-react";

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "أحمد محمود",
      role: "ولي أمر - طالب عمره 10 سنوات",
      content: "ابني أصبح يحب البرمجة بفضل In School. المدربون محترفون جداً والمنهج ممتع ومفيد.",
      rating: 5,
    },
    {
      name: "سارة علي",
      role: "ولية أمر - طالبة عمرها 12 سنة",
      content: "بنتي صنعت أول تطبيق لها! الحصص الفردية ساعدتها تتعلم بسرعتها الخاصة.",
      rating: 5,
    },
    {
      name: "محمد حسن",
      role: "ولي أمر - طالب عمره 8 سنوات",
      content: "أفضل استثمار في مستقبل ابني. المدربون صبورون ويشرحون بطريقة بسيطة.",
      rating: 5,
    },
  ];

  return (
    <section id="testimonials" className="py-20">
      <div className="container mx-auto">
        <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
          ماذا يقول <span className="text-secondary">أولياء الأمور</span>
        </h2>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="relative rounded-2xl bg-card p-8 shadow-soft transition-all duration-300 hover:shadow-card"
            >
              <Quote className="absolute left-6 top-6 h-10 w-10 text-primary/10" />
              
              <div className="mb-4 flex gap-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-secondary text-secondary" />
                ))}
              </div>

              <p className="mb-6 text-muted-foreground">{testimonial.content}</p>

              <div>
                <div className="font-bold">{testimonial.name}</div>
                <div className="text-sm text-muted-foreground">{testimonial.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
