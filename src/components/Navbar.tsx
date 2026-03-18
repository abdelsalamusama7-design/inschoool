import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { name: "المميزات", href: "#features" },
    { name: "لماذا Instatech Academy", href: "#why" },
    { name: "آراء العملاء", href: "#testimonials" },
  ];

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-md">
      <div className="container mx-auto">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">
              <span className="text-secondary">In</span>
              <span className="text-primary">School</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden items-center gap-3 lg:flex">
            <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
              تسجيل الدخول
            </Button>
            <Button size="sm" className="gradient-orange" asChild>
              <a href="https://docs.google.com/forms/d/e/1FAIpQLScMCHcf05VturMfaIkoCx_cvRZ3YpuBws5pMFdgklog0mUMpA/viewform?usp=header" target="_blank" rel="noopener noreferrer">
                احجز جلسة مجانية
              </a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 lg:hidden"
            aria-label="فتح القائمة"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="border-t border-border py-4 lg:hidden">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4">
                <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
                  تسجيل الدخول
                </Button>
                <Button size="sm" className="gradient-orange" asChild>
                  <a href="https://docs.google.com/forms/d/e/1FAIpQLScMCHcf05VturMfaIkoCx_cvRZ3YpuBws5pMFdgklog0mUMpA/viewform?usp=header" target="_blank" rel="noopener noreferrer">
                    احجز جلسة مجانية
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
