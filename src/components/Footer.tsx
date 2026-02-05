import { Link } from "react-router-dom";
import { GraduationCap, MapPin, Phone, Mail } from "lucide-react";

const Footer = () => {
  const links = {
    company: [
      { name: "من نحن", href: "#" },
      { name: "المدونة", href: "#" },
      { name: "وظائف", href: "#" },
      { name: "تواصل معنا", href: "#contact" },
    ],
    programs: [
      { name: "برمجة للأطفال", href: "#" },
      { name: "تطوير الألعاب", href: "#" },
      { name: "الذكاء الاصطناعي", href: "#" },
      { name: "تطوير المواقع", href: "#" },
    ],
    support: [
      { name: "الأسئلة الشائعة", href: "#" },
      { name: "سياسة الخصوصية", href: "#" },
      { name: "الشروط والأحكام", href: "#" },
    ],
  };

  return (
    <footer id="contact" className="border-t border-border bg-muted/30">
      <div className="container mx-auto py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link to="/" className="mb-6 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold">
                <span className="text-secondary">In</span>
                <span className="text-primary">School</span>
              </span>
            </Link>
            <p className="mb-6 text-muted-foreground">
              نبني قادة التكنولوجيا في الغد من خلال تعليم البرمجة للأطفال والشباب
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="h-5 w-5 text-primary" />
                <span>حلوان، القاهرة، مصر</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="h-5 w-5 text-primary" />
                <a href="tel:01107157075" className="hover:text-primary">
                  01107157075
                </a>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-5 w-5 text-primary" />
                <a href="mailto:info@inschool.com" className="hover:text-primary">
                  info@inschool.com
                </a>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4 font-bold">الشركة</h4>
            <ul className="flex flex-col gap-3">
              {links.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-bold">البرامج</h4>
            <ul className="flex flex-col gap-3">
              {links.programs.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-bold">الدعم</h4>
            <ul className="flex flex-col gap-3">
              {links.support.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-border">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2024 In School. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
