import { motion } from 'framer-motion';
import { FileText, Scale, ShoppingBag, Truck, RefreshCw, AlertCircle } from 'lucide-react';

const TermsOfService = () => {
    const sections = [
        {
            id: 'general',
            title: '1. Điều khoản chung',
            icon: Scale,
            content: 'Bằng cách truy cập và sử dụng website Bông Cosmetic, bạn đồng ý tuân thủ các điều khoản và điều kiện này. Chúng tôi có quyền thay đổi, chỉnh sửa, thêm hoặc lược bỏ bất kỳ phần nào trong Điều khoản sử dụng này vào bất cứ lúc nào.'
        },
        {
            id: 'account',
            title: '2. Tài khoản của bạn',
            icon: FileText,
            content: 'Khi đăng ký tài khoản, bạn có trách nhiệm bảo mật mật khẩu và các thông tin cá nhân của mình. Bạn phải thông báo ngay cho chúng tôi nếu có bất kỳ dấu hiệu truy cập trái phép nào vào tài khoản của mình.'
        },
        {
            id: 'pricing',
            title: '3. Giá cả và Thanh toán',
            icon: ShoppingBag,
            content: 'Giá của sản phẩm được niêm yết trên website là giá cuối cùng đã bao gồm thuế. Chúng tôi chấp nhận nhiều hình thức thanh toán như: Thanh toán khi nhận hàng (COD), Chuyển khoản ngân hàng, và các ví điện tử liên kết.'
        },
        {
            id: 'shipping',
            title: '4. Vận chuyển và Giao nhận',
            icon: Truck,
            content: 'Chúng tôi cam kết giao hàng trong thời gian dự kiến từ 3-5 ngày làm việc. Thời gian giao hàng có thể thay đổi tùy thuộc vào địa chỉ nhận hàng và các yếu tố khách quan khác.'
        },
        {
            id: 'returns',
            title: '5. Chính sách Đổi trả',
            icon: RefreshCw,
            content: 'Khách hàng có quyền đổi trả sản phẩm trong vòng 7 ngày kể từ ngày nhận hàng nếu sản phẩm có lỗi từ nhà sản xuất hoặc không đúng với mô tả trên website. Sản phẩm đổi trả phải còn nguyên tem mác và chưa qua sử dụng.'
        },
        {
            id: 'liability',
            title: '6. Giới hạn trách nhiệm',
            icon: AlertCircle,
            content: 'Bông Cosmetic không chịu trách nhiệm cho bất kỳ thiệt hại gián tiếp hoặc hệ lụy nào phát sinh từ việc sử dụng hoặc không thể sử dụng website hoặc sản phẩm mua từ chúng tôi.'
        }
    ];

    return (
        <div className="min-h-screen bg-background pb-20 pt-10">
            <div className="container mx-auto px-4 max-w-4xl">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6 font-bold text-primary">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tight mb-4">
                        Điều khoản <span className="text-primary font-bold italic">dịch vụ</span>
                    </h1>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        Quy định và điều kiện sử dụng dịch vụ tại hệ thống Bông Cosmetic.
                    </p>
                </motion.div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-sm">
                    <p className="text-sm text-muted-foreground mb-10 italic">Cập nhật lần cuối: 16 tháng 04, 2026</p>
                    
                    <div className="space-y-12">
                        {sections.map((section, index) => {
                            const Icon = section.icon;
                            return (
                                <motion.section 
                                    key={section.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    id={section.id}
                                    className="relative pl-12"
                                >
                                    <div className="absolute left-0 top-0 w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                                        <Icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <h2 className="text-xl font-bold text-foreground mb-4">{section.title}</h2>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {section.content}
                                    </p>
                                </motion.section>
                            );
                        })}
                    </div>

                    <div className="mt-16 p-8 rounded-2xl bg-primary/5 border border-primary/10">
                        <h3 className="text-lg font-bold text-foreground mb-2">Thắc mắc về điều khoản?</h3>
                        <p className="text-sm text-muted-foreground">
                            Nếu bạn có bất kỳ câu hỏi nào về các điều khoản này, vui lòng liên hệ với bộ phận pháp lý của chúng tôi tại <span className="text-primary font-medium">legal@bongcosmetic.vn</span>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
