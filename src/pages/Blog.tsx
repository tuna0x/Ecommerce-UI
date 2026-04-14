import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, User, ChevronRight, Search } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/ui/SEO';

const categories = ['Tất cả', 'Chăm sóc da', 'Makeup', 'Review sản phẩm', 'Mẹo làm đẹp', 'Xu hướng'];

const blogPosts = [
    {
        id: 1, title: '10 Bước Skincare Hàn Quốc Cho Làn Da Hoàn Hảo',
        excerpt: 'Khám phá quy trình chăm sóc da 10 bước nổi tiếng của Hàn Quốc giúp bạn có làn da căng bóng, mịn màng như idol K-pop.',
        image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=400&fit=crop',
        category: 'Chăm sóc da', author: 'Thu Trang', date: '15/03/2024', readTime: '8 phút',
    },
    {
        id: 2, title: 'Review Serum Vitamin C: Top 5 Sản Phẩm Đáng Mua Nhất 2024',
        excerpt: 'So sánh chi tiết 5 loại serum Vitamin C bán chạy nhất hiện nay từ thành phần, hiệu quả đến giá thành.',
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=400&fit=crop',
        category: 'Review sản phẩm', author: 'Minh Đức', date: '12/03/2024', readTime: '10 phút',
    },
    {
        id: 3, title: 'Cách Chọn Kem Chống Nắng Phù Hợp Với Từng Loại Da',
        excerpt: 'Hướng dẫn chi tiết cách chọn kem chống nắng dựa trên loại da, SPF phù hợp và cách thoa đúng cách.',
        image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&h=400&fit=crop',
        category: 'Chăm sóc da', author: 'Thanh Hà', date: '10/03/2024', readTime: '6 phút',
    },
    {
        id: 4, title: 'Xu Hướng Makeup "Clean Girl" 2024: Đẹp Tự Nhiên',
        excerpt: 'Tìm hiểu xu hướng trang điểm "Clean Girl" đang hot nhất năm 2024 với phong cách tối giản nhưng vẫn nổi bật.',
        image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=400&fit=crop',
        category: 'Xu hướng', author: 'Thu Trang', date: '08/03/2024', readTime: '5 phút',
    },
    {
        id: 5, title: '5 Mẹo Trị Mụn Tại Nhà Hiệu Quả Với Nguyên Liệu Tự Nhiên',
        excerpt: 'Những phương pháp trị mụn đơn giản tại nhà bằng nguyên liệu tự nhiên an toàn, hiệu quả bất ngờ.',
        image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&h=400&fit=crop',
        category: 'Mẹo làm đẹp', author: 'Quốc Bảo', date: '05/03/2024', readTime: '7 phút',
    },
    {
        id: 6, title: 'Hướng Dẫn Contouring Cho Từng Dáng Mặt',
        excerpt: 'Bí quyết tạo khối phù hợp với từng dáng khuôn mặt giúp bạn trông thon gọn, sắc nét hơn.',
        image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&h=400&fit=crop',
        category: 'Makeup', author: 'Thu Trang', date: '01/03/2024', readTime: '9 phút',
    },
];

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } })
};

const Blog = () => {
    const [activeCategory, setActiveCategory] = useState('Tất cả');
    const [search, setSearch] = useState('');

    const filtered = blogPosts.filter(p => {
        const matchCat = activeCategory === 'Tất cả' || p.category === activeCategory;
        const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <SEO 
                title="Blog Làm Đẹp" 
                description="Khám phá các bí quyết chăm sóc da, xu hướng trang điểm và review mỹ phẩm chân thực từ chuyên gia tại Bông Cosmetic."
                url="/blog"
                keywords="blog làm đẹp, review mỹ phẩm, bí quyết chăm sóc da, xu hướng trang điểm"
            />

            {/* Hero */}
            <section className="py-16 md:py-24" style={{ background: 'var(--gradient-hero)' }}>
                <div className="container mx-auto px-4 text-center">
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                        Blog & Mẹo Làm Đẹp
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-muted-foreground max-w-lg mx-auto mb-8">
                        Cập nhật kiến thức làm đẹp, review sản phẩm và xu hướng mới nhất
                    </motion.p>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="max-w-md mx-auto relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Tìm kiếm bài viết..." value={search} onChange={e => setSearch(e.target.value)}
                            className="pl-10" />
                    </motion.div>
                </div>
            </section>

            {/* Categories */}
            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-wrap gap-2 justify-center">
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === cat
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                }`}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Posts Grid */}
            <section className="container mx-auto px-4 pb-20">
                {filtered.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">Không tìm thấy bài viết phù hợp.</p>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filtered.map((post, i) => (
                            <motion.article key={post.id} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                                className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group cursor-pointer">
                                <div className="relative overflow-hidden aspect-[3/2]">
                                    <img src={post.image} alt={post.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">{post.category}</Badge>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.author}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                                        <span>{post.date}</span>
                                    </div>
                                    <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                        {post.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{post.excerpt}</p>
                                    <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                                        Đọc thêm <ChevronRight className="w-4 h-4" />
                                    </span>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                )}
            </section>

            <Footer />
        </div>
    );
};

export default Blog;
