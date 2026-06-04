import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Plus, Pencil, Trash2, Search, Loader2, BookOpen, User, Calendar, ImageIcon, Upload } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { DataTable } from "../../components/ui/data-table";
import { SearchableSelect } from "../../components/SearchableSelect";
import RichEditor from "../../components/admin/RichEditor";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { toast } from "sonner";
import { BlogService, type IBlog } from "../../service/blogService";
import { useDebounce } from "../../hooks/useDebounce";

const blogCategories = [
    { value: "Chăm sóc da", label: "Chăm sóc da" },
    { value: "Makeup", label: "Makeup" },
    { value: "Review sản phẩm", label: "Review sản phẩm" },
    { value: "Mẹo làm đẹp", label: "Mẹo làm đẹp" },
    { value: "Xu hướng", label: "Xu hướng" }
];

const BlogManagement: React.FC = () => {
    const [blogs, setBlogs] = useState<IBlog[]>([]);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBlogId, setEditingBlogId] = useState<number | null>(null);

    const [formData, setFormData] = useState<Partial<IBlog>>({
        title: "",
        excerpt: "",
        content: "",
        category: "Chăm sóc da",
        author: "Bông Cosmetic",
        readTime: "5 phút",
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchBlogs = useCallback(async () => {
        try {
            setIsLoading(true);
            const filter = debouncedSearch ? `title~'${debouncedSearch}'` : '';
            const res = await BlogService.getAll(currentPage, pageSize, filter, 'createdAt,desc');
            if (res.data) {
                setBlogs(res.data.result || []);
                setTotalPages(res.data.meta.pages || 0);
            }
        } catch {
            toast.error("Không thể tải danh sách bài viết");
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, pageSize, debouncedSearch]);

    useEffect(() => {
        fetchBlogs();
    }, [fetchBlogs]);

    const openDialog = (blog: IBlog | null) => {
        if (blog) {
            setEditingBlogId(blog.id);
            setFormData(blog);
            setPreviewUrl(blog.image);
        } else {
            setEditingBlogId(null);
            setFormData({
                title: "",
                excerpt: "",
                content: "",
                category: "Chăm sóc da",
                author: "Bông Cosmetic",
                readTime: "5 phút",
            });
            setPreviewUrl(null);
        }
        setSelectedFile(null);
        setIsDialogOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Ảnh vượt quá 5MB");
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!formData.title || !formData.content) {
            toast.error("Vui lòng điền đầy đủ tiêu đề và nội dung");
            return;
        }

        if (!editingBlogId && !selectedFile) {
            toast.error("Vui lòng chọn ảnh cho bài viết");
            return;
        }

        try {
            setIsSubmitting(true);
            if (editingBlogId) {
                await BlogService.update(formData, selectedFile || undefined);
                toast.success("Cập nhật bài viết thành công");
            } else {
                await BlogService.create(formData, selectedFile || undefined);
                toast.success("Thêm mới bài viết thành công");
            }
            setIsDialogOpen(false);
            fetchBlogs();
        } catch {
            toast.error("Đã xảy ra lỗi khi lưu bài viết");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
            try {
                await BlogService.remove(id);
                toast.success("Xóa bài viết thành công");
                fetchBlogs();
            } catch {
                toast.error("Không thể xóa bài viết");
            }
        }
    };

    const columns: ColumnDef<IBlog>[] = useMemo(() => [
        {
            accessorKey: "image",
            header: "Hình ảnh",
            cell: ({ row }) => (
                <div className="w-16 h-10 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
                    {row.original.image ? (
                        <img src={row.original.image} alt={row.original.title} className="w-full h-full object-cover" />
                    ) : (
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    )}
                </div>
            )
        },
        {
            accessorKey: "title",
            header: "Tiêu đề",
            cell: ({ row }) => (
                <div className="max-w-[300px]">
                    <p className="font-bold text-sm line-clamp-2">{row.original.title}</p>
                    <p className="text-[10px] text-muted-foreground">{row.original.category}</p>
                </div>
            )
        },
        {
            accessorKey: "author",
            header: "Tác giả",
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span>{row.original.author}</span>
                </div>
            )
        },
        {
            accessorKey: "createdAt",
            header: "Ngày đăng",
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(row.original.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
            )
        },
        {
            id: "actions",
            header: () => <div className="text-right">Thao tác</div>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(row.original)} className="h-8 w-8 text-blue-600">
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(row.original.id)} className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ], []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">Quản lý Blog</h1>
                    <p className="text-muted-foreground text-sm">Quản trị nội dung bài viết và cẩm nang làm đẹp</p>
                </div>
                <Button onClick={() => openDialog(null)} className="gap-2 bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4" /> Viết bài mới
                </Button>
            </div>

            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                    <div className="relative group">
                        <Search className={cn(
                            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                            isLoading ? "text-primary animate-pulse" : "text-muted-foreground group-focus-within:text-primary"
                        )} />
                        <Input
                            placeholder="Tìm kiếm tiêu đề bài viết..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 h-11 bg-background/50"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Danh sách bài viết ({blogs.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        {isLoading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        )}
                        <DataTable columns={columns} data={blogs} currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={(open) => !isSubmitting && setIsDialogOpen(open)}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight text-primary">
                            {editingBlogId ? "Sửa bài viết" : "Soạn thảo bài viết mới"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tiêu đề bài viết</Label>
                                <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Ví dụ: Cách chăm sóc da mùa đông" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Danh mục</Label>
                                <SearchableSelect 
                                    options={blogCategories}
                                    value={formData.category || null}
                                    onValueChange={(val) => setFormData({ ...formData, category: val })}
                                    placeholder="Chọn danh mục..."
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tóm tắt ngắn (Excerpt)</Label>
                            <textarea
                                className="w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20"
                                value={formData.excerpt}
                                onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                                placeholder="Mô tả ngắn gọn để hiển thị ở danh sách..."
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ảnh bài viết</Label>
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-32 h-32 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-muted group relative",
                                    previewUrl ? "border-primary/50" : "border-muted-foreground/30"
                                )}>
                                    {previewUrl ? (
                                        <>
                                            <img src={previewUrl} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button size="icon" variant="ghost" className="text-white bg-white/20 backdrop-blur-sm rounded-full" onClick={() => fileInputRef.current?.click()}>
                                                    <Upload className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <Button variant="ghost" className="flex flex-col items-center gap-1 text-muted-foreground" onClick={() => fileInputRef.current?.click()}>
                                            <ImageIcon className="w-6 h-6" />
                                            <span className="text-[10px] uppercase font-bold">Thêm ảnh</span>
                                        </Button>
                                    )}
                                </div>
                                <div className="flex-1 text-xs text-muted-foreground">
                                    <p className="font-bold text-foreground mb-1 uppercase tracking-wider italic">Gợi ý:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Kích thước tối ưu: 1200x800px (tất cả ảnh sẽ được crop chuẩn)</li>
                                        <li>Dung lượng tối đa: 5MB</li>
                                        <li>Định dạng: JPG, PNG, WEBP</li>
                                    </ul>
                                </div>
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                className="hidden" 
                                accept="image/*"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tác giả</Label>
                                <Input value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Thời gian đọc</Label>
                                <Input value={formData.readTime} onChange={e => setFormData({ ...formData, readTime: e.target.value })} placeholder="Ví dụ: 8 phút" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nội dung bài viết</Label>
                            <RichEditor 
                                value={formData.content || ""} 
                                onChange={(val) => setFormData({ ...formData, content: val })} 
                                placeholder="Bắt đầu viết nội dung bài viết tuyệt vời của bạn tại đây..."
                            />
                        </div>
                    </div>
                    <DialogFooter className="bg-muted/30 -mx-6 -mb-6 p-6 mt-4 border-t border-border">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Hủy bỏ</Button>
                        <Button onClick={handleSave} disabled={isSubmitting} className="font-bold px-8 shadow-lg shadow-primary/20 bg-primary">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingBlogId ? "Cập nhật ngay" : "Đăng bài viết")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BlogManagement;


