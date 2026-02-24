import React from "react";
import {
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

const Footer: React.FC = () => {
  const footerLinks = {
    shop: ["All Products", "New Arrivals", "Best Sellers", "Sale"],
    company: ["About Us", "Careers", "Press", "Blog"],
    support: ["Contact", "FAQs", "Shipping", "Returns"],
  };

  const socialLinks = [
    { icon: Instagram, href: "#" },
    { icon: Twitter, href: "#" },
    { icon: Facebook, href: "#" },
    { icon: Youtube, href: "#" },
  ];

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <a
              href="/"
              className="text-2xl font-bold tracking-tight inline-block mb-4"
            >
              TUNAHOUSE<span className="text-primary">.</span>
            </a>
            <p className="text-background/70 max-w-sm mb-6 leading-relaxed">
              Curating premium products for the modern lifestyle. Quality,
              simplicity, and timeless design.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    className="p-2.5 bg-background/10 hover:bg-primary hover:text-primary-foreground rounded-full transition-colors duration-200"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-background/70 hover:text-primary transition-colors duration-200"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-background/70 hover:text-primary transition-colors duration-200"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-background/70">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>tuanzkt2711@gmail.com</span>
              </li>
              <li className="flex items-center gap-3 text-background/70">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+84 865190253</span>
              </li>
              <li className="flex items-start gap-3 text-background/70">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Thanh xuan, Ha Noi</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-background/50 text-sm">
            © 2026 TUNAHOUSE. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-background/50">
            <a href="#" className="hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Terms of Service
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
