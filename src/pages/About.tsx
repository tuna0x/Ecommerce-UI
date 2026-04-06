
import { motion } from 'framer-motion';
import { Heart, Leaf, Shield, Star, Award } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.15, duration: 0.6, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }
    })
};

const values = [
    { icon: Leaf, title: 'Thiên nhiên thuần khiết', desc: 'Nguyên liệu hữu cơ, không hóa chất độc hại, an toàn cho mọi loại da.' },
    { icon: Shield, title: 'Chất lượng đảm bảo', desc: 'Sản phẩm được kiểm nghiệm nghiêm ngặt, đạt chuẩn quốc tế.' },
    { icon: Heart, title: 'Yêu thương khách hàng', desc: 'Tư vấn tận tâm, chính sách đổi trả linh hoạt, hỗ trợ 24/7.' },
    { icon: Star, title: 'Đổi mới sáng tạo', desc: 'Không ngừng nghiên cứu công nghệ làm đẹp tiên tiến nhất.' },
];

const team = [
    { name: 'Nguyễn Thanh Hà', role: 'Nhà sáng lập & CEO', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face' },
    { name: 'Trần Minh Đức', role: 'Giám đốc R&D', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face' },
    { name: 'Lê Thu Trang', role: 'Chuyên gia da liễu', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face' },
    { name: 'Phạm Quốc Bảo', role: 'Giám đốc Marketing', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face' },
];

const milestones = [
    { year: '2018', event: 'Thành lập BeautyLux với sứ mệnh mang làn da khỏe đẹp cho phụ nữ Việt.' },
    { year: '2019', event: 'Ra mắt dòng serum Vitamin C đầu tiên, bán hết 10.000 chai trong 2 tuần.' },
    { year: '2021', event: 'Mở rộng 15 cửa hàng trên toàn quốc, phục vụ 500.000+ khách hàng.' },
    { year: '2023', event: 'Đạt giải "Thương hiệu mỹ phẩm được yêu thích nhất" năm thứ 2 liên tiếp.' },
    { year: '2024', event: 'Ra mắt nền tảng thương mại điện tử và hệ thống tư vấn AI.' },
];

const About = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />

            {/* Hero */}
            <section className="relative overflow-hidden py-20 md:py-32" style={{ background: 'var(--gradient-hero)' }}>
                <div className="container mx-auto px-4 text-center">
                    <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
                        <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                            Câu chuyện của chúng tôi
                        </span>
                    </motion.div>
                    <motion.h1 variants={fadeUp} custom={1} initial="hidden" animate="visible"
                        className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                        Nơi vẻ đẹp tự nhiên<br />
                        <span className="text-primary">tỏa sáng</span>
                    </motion.h1>
                    <motion.p variants={fadeUp} custom={2} initial="hidden" animate="visible"
                        className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        BeautyLux ra đời với khát vọng mang đến những sản phẩm làm đẹp an toàn, hiệu quả,
                        giúp mỗi phụ nữ Việt tự tin tỏa sáng với vẻ đẹp tự nhiên nhất.
                    </motion.p>
                </div>
            </section>

            {/* Story */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
                            <img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=500&fit=crop" alt="BeautyLux story" className="rounded-2xl shadow-lg w-full object-cover aspect-[6/5]" />
                        </motion.div>
                        <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
                            <h2 className="text-3xl font-bold text-foreground mb-6">Hành trình từ đam mê đến thương hiệu</h2>
                            <div className="space-y-4 text-muted-foreground leading-relaxed">
                                <p>
                                    Bắt đầu từ một phòng thí nghiệm nhỏ tại Sài Gòn năm 2018, BeautyLux được sinh ra từ niềm đam mê
                                    nghiên cứu và phát triển các công thức chăm sóc da hiệu quả, an toàn với thiên nhiên.
                                </p>
                                <p>
                                    Chúng tôi tin rằng mỗi người phụ nữ đều xứng đáng được sử dụng những sản phẩm tốt nhất — không chứa
                                    paraben, sulfate hay bất kỳ hóa chất gây hại nào. Mỗi sản phẩm đều trải qua quy trình kiểm nghiệm
                                    nghiêm ngặt trước khi đến tay khách hàng.
                                </p>
                                <p>
                                    Sau 6 năm phát triển, BeautyLux tự hào là thương hiệu mỹ phẩm Việt Nam được hơn 1 triệu khách hàng
                                    tin yêu, với hơn 200+ sản phẩm đa dạng phục vụ mọi nhu cầu làm đẹp.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-16 bg-secondary/50">
                <div className="container mx-auto px-4">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
                        <motion.h2 variants={fadeUp} custom={0} className="text-3xl font-bold text-foreground mb-3">Giá trị cốt lõi</motion.h2>
                        <motion.p variants={fadeUp} custom={1} className="text-muted-foreground">Những giá trị định hướng mọi hoạt động của chúng tôi</motion.p>
                    </motion.div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {values.map((v, i) => (
                            <motion.div key={i} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                                className="bg-card rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <v.icon className="w-7 h-7 text-primary" />
                                </div>
                                <h3 className="font-semibold text-foreground mb-2">{v.title}</h3>
                                <p className="text-sm text-muted-foreground">{v.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4 max-w-3xl">
                    <h2 className="text-3xl font-bold text-foreground text-center mb-12">Cột mốc phát triển</h2>
                    <div className="relative">
                        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border" />
                        {milestones.map((m, i) => (
                            <motion.div key={i} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                                className={`relative flex items-start gap-6 mb-10 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                                <div className="hidden md:block md:w-1/2" />
                                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold z-10">
                                    <Award className="w-4 h-4" />
                                </div>
                                <div className="ml-14 md:ml-0 md:w-1/2 bg-card rounded-xl p-5 shadow-sm">
                                    <span className="text-primary font-bold text-lg">{m.year}</span>
                                    <p className="text-muted-foreground text-sm mt-1">{m.event}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="py-16 bg-secondary/50">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-foreground text-center mb-3">Đội ngũ của chúng tôi</h2>
                    <p className="text-muted-foreground text-center mb-12">Những con người tài năng đằng sau BeautyLux</p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
                        {team.map((member, i) => (
                            <motion.div key={i} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                                className="text-center group">
                                <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden ring-4 ring-primary/20 group-hover:ring-primary/50 transition-all">
                                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                <h3 className="font-semibold text-foreground">{member.name}</h3>
                                <p className="text-sm text-muted-foreground">{member.role}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { num: '1M+', label: 'Khách hàng tin yêu' },
                            { num: '200+', label: 'Sản phẩm đa dạng' },
                            { num: '15', label: 'Cửa hàng toàn quốc' },
                            { num: '98%', label: 'Khách hàng hài lòng' },
                        ].map((s, i) => (
                            <motion.div key={i} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{s.num}</div>
                                <div className="text-sm text-muted-foreground">{s.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default About;
