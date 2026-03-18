const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="h-8 w-8 fill-white">
    <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.96A15.9 15.9 0 0 0 16.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.35 22.606c-.39 1.1-1.932 2.014-3.164 2.28-.844.18-1.946.322-5.656-1.216-4.748-1.966-7.804-6.778-8.04-7.092-.226-.314-1.9-2.532-1.9-4.83s1.2-3.428 1.628-3.896c.39-.426 1.026-.622 1.634-.622.198 0 .376.01.536.018.468.02.702.048 1.012.784.386.918 1.326 3.232 1.442 3.466.118.236.236.556.076.87-.15.322-.282.522-.518.798-.236.274-.46.484-.696.78-.216.256-.46.53-.196.998.264.46 1.174 1.936 2.52 3.136 1.734 1.544 3.194 2.024 3.648 2.246.35.174.768.134 1.042-.156.348-.37.778-.982 1.216-1.586.312-.43.706-.484 1.094-.332.394.146 2.496 1.178 2.924 1.392.428.216.712.322.818.498.104.178.104 1.026-.286 2.124z" />
  </svg>
);

const WhatsAppButton = () => {
  const phoneNumber = "201107157075";
  const message = "مرحباً، أريد الاستفسار عن دورات Instatech Academy";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
      aria-label="تواصل معنا عبر واتساب"
    >
      <WhatsAppIcon />
    </a>
  );
};

export default WhatsAppButton;
