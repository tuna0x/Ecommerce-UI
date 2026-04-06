import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ShieldCheck, RotateCcw, Truck, CreditCard, HelpCircle, Package } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import Header from '../components/Header';
import Footer from '../components/Footer';

const faqCategories = [
    {
        icon: Package, title: 'Đặt hàng',
        questions: [
            { q: 'Làm thế nào để đặt hàng trên BeautyLux?', a: 'Bạn chỉ cần chọn sản phẩm, thêm vào giỏ hàng, điền thông tin giao hàng và chọn phương thức thanh toán. Đơn hàng sẽ được xác nhận qua email và SMS.' },
            { q: 'Tôi có thể thay đổi hoặc hủy đơn hàng không?', a: 'Bạn có thể thay đổi hoặc hủy đơn hàng trong vòng 30 phút sau khi đặt. Sau thời gian này, vui lòng liên hệ hotline 1900 1234 để được hỗ trợ.' },
            { q: 'Đơn hàng tối thiểu là bao nhiêu?', a: 'Không có giá trị đơn hàng tối thiểu. Tuy nhiên, đơn hàng từ 500.000₫ sẽ được miễn phí vận chuyển.' },
        ]
    },
    {
        icon: Truck, title: 'Vận chuyển',
        questions: [
            { q: 'Thời gian giao hàng là bao lâu?', a: 'Nội thành TP.HCM: 1-2 ngày. Các tỉnh thành khác: 3-5 ngày làm việc. Đơn hàng express sẽ được giao trong ngày (chỉ áp dụng nội thành).' },
            { q: 'Phí vận chuyển là bao nhiêu?', a: 'Phí vận chuyển từ 15.000₫ - 30.000₫ tùy khu vực. Miễn phí vận chuyển cho đơn hàng từ 500.000₫.' },
            { q: 'Tôi có thể theo dõi đơn hàng không?', a: 'Có, bạn có thể theo dõi trạng thái đơn hàng trong mục "Đơn hàng" trên tài khoản hoặc qua link tracking gửi qua SMS/email.' },
        ]
    },
    {
        icon: CreditCard, title: 'Thanh toán',
        questions: [
            { q: 'Có những phương thức thanh toán nào?', a: 'BeautyLux hỗ trợ: Thanh toán khi nhận hàng (COD), chuyển khoản ngân hàng, ví MoMo, ZaloPay, VNPay và thẻ tín dụng/ghi nợ quốc tế.' },
            { q: 'Thanh toán online có an toàn không?', a: 'Tất cả giao dịch đều được mã hóa SSL 256-bit. Chúng tôi không lưu trữ thông tin thẻ của bạn. Các cổng thanh toán đều đạt chuẩn PCI DSS.' },
        ]
    },
    {
        icon: RotateCcw, title: 'Đổi trả & Hoàn tiền',
        questions: [
            { q: 'Chính sách đổi trả như thế nào?', a: 'Bạn có thể đổi trả sản phẩm trong vòng 7 ngày kể từ ngày nhận hàng nếu sản phẩm bị lỗi, hư hỏng hoặc không đúng mô tả. Sản phẩm phải còn nguyên seal, chưa qua sử dụng.' },
            { q: 'Thời gian hoàn tiền mất bao lâu?', a: 'Hoàn tiền qua tài khoản ngân hàng: 3-5 ngày làm việc. Hoàn tiền qua ví điện tử: 1-2 ngày. Hoàn tiền bằng voucher: ngay lập tức.' },
            { q: 'Sản phẩm nào không được đổi trả?', a: 'Sản phẩm đã mở seal/sử dụng, sản phẩm mua trong chương trình khuyến mãi đặc biệt (có ghi chú không đổi trả), và sản phẩm quà tặng/sample.' },
        ]
    },
    {
        icon: ShieldCheck, title: 'Bảo mật & Tài khoản',
        questions: [
            { q: 'Thông tin cá nhân của tôi có được bảo mật không?', a: 'BeautyLux cam kết bảo mật tuyệt đối thông tin cá nhân của khách hàng theo chính sách bảo mật và quy định pháp luật Việt Nam.' },
            { q: 'Làm sao để đặt lại mật khẩu?', a: 'Vào trang đăng nhập, chọn "Quên mật khẩu", nhập email đã đăng ký. Link đặt lại mật khẩu sẽ được gửi đến email của bạn trong vài phút.' },
        ]
    },
];

const FAQ = () => {
    const [search, setSearch] = useState('');

    const filteredCategories = faqCategories.map(cat => ({
        ...cat,
        questions: cat.questions.filter(q =>
            q.q.toLowerCase().includes(search.toLowerCase()) || q.a.toLowerCase().includes(search.toLowerCase())
        ),
    })).filter(cat => cat.questions.length > 0);

    return (
        <div className="min-h-screen bg-background">
            <Header />

            {/* Hero */}
            <section className="py-16 md:py-20" style={{ background: 'var(--gradient-hero)' }}>
                <div className="container mx-auto px-4 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                        <HelpCircle className="w-8 h-8 text-primary" />
                    </motion.div>
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                        className="text-4xl md:text-5xl font-bold text-foreground mb-4">Câu hỏi thường gặp</motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-muted-foreground max-w-lg mx-auto mb-8">
                        Tìm câu trả lời nhanh cho các thắc mắc phổ biến về mua sắm tại BeautyLux
                    </motion.p>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        className="max-w-md mx-auto relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Tìm kiếm câu hỏi..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
                    </motion.div>
                </div>
            </section>

            {/* FAQ Content */}
            <section className="container mx-auto px-4 py-12 max-w-3xl">
                {filteredCategories.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">Không tìm thấy câu hỏi phù hợp.</p>
                ) : (
                    <div className="space-y-8">
                        {filteredCategories.map((cat, ci) => (
                            <motion.div key={ci} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                transition={{ delay: ci * 0.1 }}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <cat.icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <h2 className="text-xl font-bold text-foreground">{cat.title}</h2>
                                </div>
                                <Accordion type="single" collapsible className="bg-card rounded-xl shadow-sm overflow-hidden">
                                    {cat.questions.map((faq, qi) => (
                                        <AccordionItem key={qi} value={`${ci}-${qi}`} className="border-border">
                                            <AccordionTrigger className="px-5 text-left text-foreground hover:text-primary hover:no-underline">
                                                {faq.q}
                                            </AccordionTrigger>
                                            <AccordionContent className="px-5 text-muted-foreground leading-relaxed">
                                                {faq.a}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* CTA */}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="mt-16 text-center bg-card rounded-xl p-8 shadow-sm">
                    <h3 className="text-xl font-bold text-foreground mb-2">Không tìm thấy câu trả lời?</h3>
                    <p className="text-muted-foreground mb-4">Liên hệ đội ngũ hỗ trợ của chúng tôi để được giải đáp nhanh chóng.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <a href="/contact" className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
                            Liên hệ hỗ trợ
                        </a>
                        <a href="tel:19001234" className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg border border-border text-foreground font-medium hover:bg-secondary transition-colors">
                            Gọi 1900 1234
                        </a>
                    </div>
                </motion.div>
            </section>

            <Footer />
        </div>
    );
};

export default FAQ;
