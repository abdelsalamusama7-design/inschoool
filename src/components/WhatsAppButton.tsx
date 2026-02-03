import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => {
  const phoneNumber = "201107157075";
  const message = "مرحباً، أريد الاستفسار عن دورات In School";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
      aria-label="تواصل معنا عبر واتساب"
    >
      <MessageCircle className="h-7 w-7" fill="currentColor" />
    </a>
  );
};

export default WhatsAppButton;
