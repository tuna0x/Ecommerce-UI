import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Clock, 
  User, 
  ChevronLeft, 
  Calendar, 
  Share2, 
  Bookmark,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { BlogService, type IBlog } from '../service/blogService';
import { Badge } from '../components/ui/badge';
import SEO from '../components/ui/SEO';
import { Button } from '../components/ui/button';

const BlogDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [blog, setBlog] = useState<IBlog | null>(null);
    const [loading, setLoading] = useState(true);
    const [latestBlogs, setLatestBlogs] = useState<IBlog[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const [blogRes, latestRes] = await Promise.all([
                    BlogService.getById(Number(id)),
                    BlogService.getAll(1, 3, '', 'createdAt,desc')
                ]);
                
                if (blogRes.data) {
                    setBlog(blogRes.data);
                }
                if (latestRes.data) {
                    setLatestBlogs(latestRes.data.result || []);
                }
            } catch (error) {
                console.error("Failed to fetch blog detail:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        window.scrollTo(0, 0);
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50 mb-4" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">Đang tải nội dung bài viết...</p>
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-bold mb-4">Oops! Không tìm thấy bài viết</h2>
                <Button onClick={() => navigate('/blog')}>Quay lại Blog</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <SEO 
                title={blog.title} 
                description={blog.excerpt}
                url={`/blog/${blog.id}`}
                image={blog.image}
            />

            {/* Breadcrumb & Subnav */}
            <div className="bg-secondary/20 border-b border-border">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-foreground font-medium truncate">{blog.title}</span>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8 md:py-12">
                <div className="grid lg:grid-cols-3 gap-12">
                    {/* Left Column - Content */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Badge className="mb-4 bg-primary text-primary-foreground text-xs uppercase tracking-widest font-bold">
                                {blog.category}
                            </Badge>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground mb-6 leading-tight">
                                {blog.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-8 pb-8 border-b border-border">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="w-4 h-4 text-primary" />
                                    </div>
                                    <span className="font-bold text-foreground">{blog.author}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(blog.createdAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>{blog.readTime} đọc</span>
                                </div>
                            </div>

                            <div className="aspect-[21/9] rounded-3xl overflow-hidden mb-10 shadow-2xl">
                                <img 
                                    src={blog.image} 
                                    alt={blog.title} 
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Main Post Content */}
                            <div 
                                className="prose prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:text-muted-foreground prose-img:rounded-3xl prose-a:text-primary"
                                dangerouslySetInnerHTML={{ __html: blog.content }}
                            />

                            <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Chia sẻ:</span>
                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                                        <Share2 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                                        <Bookmark className="w-4 h-4" />
                                    </Button>
                                </div>
                                <Link to="/blog">
                                    <Button variant="outline" className="rounded-full flex items-center gap-2">
                                        <ChevronLeft className="w-4 h-4" /> Quay lại Blog
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="lg:col-span-1 space-y-10">
                        {/* Latest Posts */}
                        <div className="bg-secondary/10 rounded-3xl p-6 border border-border/50">
                            <h3 className="text-lg font-black mb-6 flex items-center gap-2 border-b border-border pb-4">
                                <Calendar className="w-5 h-5 text-primary" /> Bài viết mới nhất
                            </h3>
                            <div className="space-y-6">
                                {latestBlogs.filter(p => p.id !== blog.id).map(post => (
                                    <Link key={post.id} to={`/blog/${post.id}`} className="group flex gap-4">
                                        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 shadow-sm">
                                            <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold line-clamp-2 group-hover:text-primary transition-colors leading-tight mb-1">
                                                {post.title}
                                            </h4>
                                            <span className="text-[10px] text-muted-foreground font-medium">{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Newsletter CTA */}
                        <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10 text-center">
                            <h3 className="text-xl font-black mb-2">Đừng bỏ lỡ cẩm nang làm đẹp!</h3>
                            <p className="text-sm text-muted-foreground mb-6">Đăng ký nhận bản tin để nhận những mẹo skincare và makeup hot nhất mỗi tuần.</p>
                            <Link to="/">
                                <Button className="w-full rounded-2xl font-bold bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20">
                                    ĐĂNG KÝ NGAY
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default BlogDetail;
