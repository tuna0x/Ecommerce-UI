import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, User, ChevronRight, Search, Loader2 } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import SEO from '../components/ui/SEO';
import { BlogService, type IBlog } from '../service/blogService';
import type { IPagination } from '../types/api.type';

const categories = ['Tất cả', 'Chăm sóc da', 'Makeup', 'Review sản phẩm', 'Mẹo làm đẹp', 'Xu hướng'];

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } })
};

const Blog = () => {
    const navigate = useNavigate();
    const [blogs, setBlogs] = useState<IBlog[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('Tất cả');
    const [search, setSearch] = useState('');

    const fetchBlogs = useCallback(async () => {
        try {
            setLoading(true);
            let filterString = '';
            if (activeCategory !== 'Tất cả') {
                filterString = `category:'${activeCategory}'`;
            }
            if (search) {
                const searchFilter = `title~'${search}'`;
                filterString = filterString ? `${filterString} and ${searchFilter}` : searchFilter;
            }

            const res = await BlogService.getAll(1, 12, filterString, 'createdAt,desc');
            if (res.data) {
                const data = res.data as unknown as IPagination<IBlog>;
                setBlogs(data.result || []);
            }
        } catch (error) {
            console.error("Failed to fetch blogs:", error);
        } finally {
            setLoading(false);
        }
    }, [activeCategory, search]);

    useEffect(() => {
        const timer = setTimeout(fetchBlogs, 300);
        return () => clearTimeout(timer);
    }, [fetchBlogs]);

    return (
        <div className="min-h-screen bg-background pb-20">
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
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50 mb-4" />
                        <p className="text-sm font-medium text-muted-foreground animate-pulse">Đang tải bài viết...</p>
                    </div>
                ) : blogs.length === 0 ? (
                    <div className="text-center py-20 bg-secondary/20 rounded-3xl border border-dashed border-border">
                        <p className="text-muted-foreground">Không tìm thấy bài viết nào phù hợp.</p>
                        <button onClick={() => { setSearch(''); setActiveCategory('Tất cả'); }} className="text-primary font-bold mt-2 hover:underline">Xem tất cả</button>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {blogs.map((post, i) => (
                            <motion.article 
                                key={post.id} 
                                variants={fadeUp} 
                                custom={i} 
                                initial="hidden" 
                                whileInView="visible" 
                                viewport={{ once: true }}
                                className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group cursor-pointer"
                                onClick={() => navigate(`/blog/${post.id}`)}
                            >
                                <div className="relative overflow-hidden aspect-[3/2]">
                                    <img src={post.image} alt={post.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">{post.category}</Badge>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.author}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                                        <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
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

        </div>
    );
};

export default Blog;
