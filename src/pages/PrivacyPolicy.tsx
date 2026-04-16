import { motion } from 'framer-motion';
import { Shield, Lock, Eye, UserCheck, Mail, Database } from 'lucide-react';

const PrivacyPolicy = () => {
    const sections = [
        {
            id: 'collection',
            title: '1. Thu thập thông tin cá nhân',
            icon: Database,
            content: 'Chúng tôi thu thập các thông tin cần thiết để phục vụ quá trình đặt hàng và hỗ trợ khách hàng, bao gồm: Họ tên, địa chỉ email, số điện thoại, và địa chỉ giao hàng. Các thông tin này được thu nhập khi bạn đăng ký tài khoản hoặc tiến hành mua sắm tại Bông Cosmetic.'
        },
        {
            id: 'usage',
            title: '2. Mục đích sử dụng thông tin',
            icon: UserCheck,
            content: 'Thông tin của bạn được sử dụng để: Xử lý đơn hàng, cung cấp dịch vụ khách hàng, gửi thông báo về tình trạng đơn hàng, và cung cấp các chương trình khuyến mãi (nếu bạn đồng ý nhận). Chúng tôi cam kết không bán hoặc chia sẻ thông tin của bạn cho bên thứ ba cho mục đích quảng cáo.'
        },
        {
            id: 'security',
            title: '3. Bảo mật thông tin',
            icon: Lock,
            content: 'Bông Cosmetic áp dụng các biện pháp bảo mật tiêu chuẩn ngành để bảo vệ dữ liệu cá nhân của bạn. Tất cả các giao dịch thanh toán đều được mã hóa bằng công nghệ SSL (Secure Socket Layer) và mật khẩu của bạn được lưu trữ dưới dạng mã hóa an toàn.'
        },
        {
            id: 'cookies',
            title: '4. Sử dụng Cookie',
            icon: Eye,
            content: 'Chúng tôi sử dụng cookie để nâng cao trải nghiệm của bạn trên website, ghi nhớ sản phẩm trong giỏ hàng và phân tích xu hướng mua sắm để cải thiện dịch vụ. Bạn có thể chọn tắt cookie trong cài đặt trình duyệt, nhưng điều này có thể ảnh hưởng đến một số tính năng của trang web.'
        },
        {
            id: 'rights',
            title: '5. Quyền lợi của bạn',
            icon: Shield,
            content: 'Bạn có quyền truy cập, chỉnh sửa hoặc yêu cầu xóa thông tin cá nhân của mình bất cứ lúc nào thông qua trang quản lý tài khoản hoặc bằng cách liên hệ trực tiếp với bộ phận chăm sóc khách hàng của chúng tôi.'
        },
        {
            id: 'contact',
            title: '6. Liên hệ với chúng tôi',
            icon: Mail,
            content: 'Nếu bạn có bất kỳ thắc mắc nào về Chính sách bảo mật này, vui lòng liên hệ với chúng tôi qua email: privacy@bongcosmetic.vn hoặc số hotline: 1900 123 456.'
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
                        <Shield className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tight mb-4">
                        Chính sách <span className="text-primary font-bold italic">bảo mật</span>
                    </h1>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        Cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của khách hàng một cách tuyệt đối tại Bông Cosmetic.
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

                    <div className="mt-16 p-6 rounded-2xl bg-secondary/30 border border-secondary text-center">
                        <p className="text-sm text-muted-foreground">
                            Bằng việc sử dụng website của chúng tôi, bạn đồng ý với việc thu thập và sử dụng thông tin theo chính sách này.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
