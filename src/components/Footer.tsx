import React from 'react';
import { Instagram, Twitter, Facebook, Youtube, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const footerLinks = {
    shop: [
      { label: 'Chăm sóc da', to: '/category/cham-soc-da' },
      { label: 'Trang điểm', to: '/category/trang-diem' },
      { label: 'Chăm sóc tóc', to: '/category/cham-soc-toc' },
      { label: 'Nước hoa', to: '/category/nuoc-hoa' },
    ],
    support: [
      { label: 'Liên hệ', to: '/contact' },
      { label: 'Câu hỏi thường gặp', to: '/faq' },
      { label: 'Vận chuyển', to: '/faq' },
      { label: 'Đổi trả', to: '/faq' },
    ],
    company: [
      { label: 'Về chúng tôi', to: '/about' },
      { label: 'Blog', to: '/blog' },
      { label: 'Flash Sale', to: '/flash-sale' },
      { label: 'Thương hiệu', to: '/brands' },
    ],
  };

  const socialLinks = [
    { icon: Instagram, href: '#' },
    { icon: Twitter, href: '#' },
    { icon: Facebook, href: '#' },
    { icon: Youtube, href: '#' },
  ];

  return (
    <footer className="bg-foreground text-background border-t border-background/10">
      <div className="container mx-auto py-14 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8 items-start">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <a href="/" className="text-xl font-bold tracking-tight inline-block mb-3">
              BEAUTY<span className="text-primary">LUX</span>
            </a>
            <p className="text-background/60 max-w-xs mb-5 text-sm leading-relaxed">
              Nơi hội tụ những sản phẩm làm đẹp cao cấp, chính hãng. Chất lượng và sự tinh tế trong từng sản phẩm.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-2.5">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    className="w-9 h-9 flex items-center justify-center bg-background/10 hover:bg-primary rounded-full transition-all duration-200 group"
                  >
                    <Icon className="w-4 h-4 text-background/50 group-hover:text-primary-foreground transition-colors" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-sm font-semibold tracking-wide mb-4 text-background/90">Sản phẩm</h4>
            <ul className="space-y-2.5">
              {footerLinks.shop.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-[13px] text-background/55 hover:text-primary transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-sm font-semibold tracking-wide mb-4 text-background/90">Hỗ trợ</h4>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-[13px] text-background/55 hover:text-primary transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-semibold tracking-wide mb-4 text-background/90">Công ty</h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-[13px] text-background/55 hover:text-primary transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-semibold tracking-wide mb-4 text-background/90">Liên hệ</h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2.5 text-background/55">
                <Mail className="w-3.5 h-3.5 flex-shrink-0 text-primary/70" />
                <span className="text-[13px]">hello@beautylux.vn</span>
              </li>
              <li className="flex items-center gap-2.5 text-background/55">
                <Phone className="w-3.5 h-3.5 flex-shrink-0 text-primary/70" />
                <span className="text-[13px]">1900 123 456</span>
              </li>
              <li className="flex items-start gap-2.5 text-background/55">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary/70" />
                <span className="text-[13px]">123 Nguyễn Huệ, Q.1, TP. Hồ Chí Minh</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/8 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-background/40 text-xs">
            © 2026 BeautyLux. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-background/40">
            <a href="#" className="hover:text-primary transition-colors">
              Chính sách bảo mật
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Điều khoản sử dụng
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
