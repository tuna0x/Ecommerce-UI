import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { contactService } from "../service/contactService";
import type { ContactFormData } from "../service/contactService";

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    if (typeof response?.data?.message === "string") return response.data.message;
  }
  return fallback;
};

const contactInfo = [
  {
    icon: MapPin,
    title: "Địa chỉ",
    lines: ["180 P.Triều Khúc, Thanh Xuân", "TP. Hà Nội, Việt Nam"],
  },
  {
    icon: Phone,
    title: "Điện thoại",
    lines: ["Hotline: 1900 1234", "CSKH: 028 1234 5678"],
  },
  {
    icon: Mail,
    title: "Email",
    lines: ["support@BÔNGCOSMETIC.vn", "business@BÔNGCOSMETIC.vn"],
  },
  {
    icon: Clock,
    title: "Giờ làm việc",
    lines: ["Thứ 2 - Thứ 7: 8:00 - 21:00", "Chủ nhật: 9:00 - 18:00"],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await contactService.sendContactMessage(formData);
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      toast.success("Gửi liên hệ thành công! Chúng tôi sẽ phản hồi sớm nhất.");
    } catch (error: unknown) {
      console.error("Contact error:", error);
      const errorMsg = getApiErrorMessage(error, "Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau.");
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero */}
      <section
        className="py-16 md:py-20"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-[1.5] md:leading-[1.5]"
          >
            Liên hệ với chúng tôi
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-lg mx-auto"
          >
            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy để lại tin nhắn
            hoặc liên hệ trực tiếp!
          </motion.p>
        </div>
      </section>

      {/* Info Cards */}
      <section className="container mx-auto px-4 -mt-8 relative z-10 mb-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {contactInfo.map((info, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="bg-card rounded-xl p-5 shadow-sm text-center hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <info.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                {info.title}
              </h3>
              {info.lines.map((line, j) => (
                <p key={j} className="text-sm text-muted-foreground">
                  {line}
                </p>
              ))}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Form + Map */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-xl p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Gửi tin nhắn
            </h2>
            {submitted ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Cảm ơn bạn!
                </h3>
                <p className="text-muted-foreground mb-4">
                  Chúng tôi đã nhận được tin nhắn và sẽ phản hồi trong 24h.
                </p>
                <Button onClick={() => setSubmitted(false)} variant="outline">
                  Gửi tin nhắn khác
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Họ và tên *</Label>
                    <Input
                      id="name"
                      placeholder="Nguyễn Văn A"
                      required
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      required
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    placeholder="0901 234 567"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Chủ đề *</Label>
                  <Input
                    id="subject"
                    placeholder="Tư vấn sản phẩm, hỗ trợ đơn hàng..."
                    required
                    value={formData.subject}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Nội dung *</Label>
                  <Textarea
                    id="message"
                    placeholder="Nhập nội dung tin nhắn của bạn..."
                    rows={5}
                    required
                    value={formData.message}
                    onChange={handleChange}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {loading ? "Đang gửi..." : "Gửi tin nhắn"}
                </Button>
              </form>
            )}
          </motion.div>

          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-xl overflow-hidden shadow-sm min-h-[400px]"
          >
            <iframe
              title="BÔNGCOSMETIC Store Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d553.7679239380577!2d105.80072244705185!3d20.980941228938242!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ad0038042ebf%3A0xa1f0a93f3c26758c!2sB%C3%B4ng%20Cosmetic!5e0!3m2!1sen!2s!4v1777221439470!5m2!1sen!2s"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 400 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
