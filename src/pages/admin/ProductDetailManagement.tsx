import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Pencil, Plus, Eye, FileText, Loader2, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../../components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';
import productDetailService from '../../service/productDetailService';
import { ProductService } from '../../service/productService';
import type { IProductDetail } from '../../types/productDetail.type';
import type { IProduct } from '../../types/product.type';
import PaginationControl from '../../components/PaginationControl';

const ProductDetailManagement: React.FC = () => {
    const [searchParams] = useSearchParams();
    const productIdFromQuery = searchParams.get('productId');

    const [details, setDetails] = useState<IProductDetail[]>([]);
    const [products, setProducts] = useState<IProduct[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [editingDetail, setEditingDetail] = useState<IProductDetail | null>(null);
    const [previewDetail, setPreviewDetail] = useState<IProductDetail | null>(null);

    // Auto-open form from query param
    useEffect(() => {
        if (productIdFromQuery && products.length > 0) {
            const existingDetail = details.find(d => d.product.id.toString() === productIdFromQuery);
            if (existingDetail) {
                // If detail exists, open edit dialog
                handleOpenDialog(existingDetail);
            } else {
                // If no detail exists, check if product is valid then open add dialog
                const product = products.find(p => p.id.toString() === productIdFromQuery);
                if (product) {
                    handleOpenDialog();
                    setFormData(prev => ({ ...prev, productId: product.id.toString() }));
                }
            }
        }
    }, [productIdFromQuery, products, details]);

    // Pagination state
    const [meta, setMeta] = useState({
        current: 1,
        pageSize: 8,
        pages: 1,
        total: 0
    });

    const [formData, setFormData] = useState({
        productId: '',
        description: '',
        ingredient: '',
        usageGuide: '',
        specification: '',
    });

    const fetchDetails = useCallback(async (page: number, search?: string) => {
        setLoading(true);
        try {
            const res = await productDetailService.getAll(page - 1, meta.pageSize, search);
            if (res.data) {
                setDetails(res.data.result);
                setMeta({
                    current: res.data.meta.page,
                    pageSize: res.data.meta.pageSize,
                    pages: res.data.meta.pages,
                    total: res.data.meta.total
                });
            }
        } catch (error) {
            console.error(error);
            toast.error('Không thể tải danh sách chi tiết sản phẩm');
        } finally {
            setLoading(false);
        }
    }, [meta.pageSize]);

    const fetchProducts = async () => {
        try {
            const res = await ProductService.getAll(0, 100); // Fetch up to 100 products
            if (res.data) {
                setProducts(res.data.result);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchDetails(1);
        fetchProducts();
    }, [fetchDetails]);

    const handleSearch = () => {
        fetchDetails(1, searchTerm);
    };

    const handleOpenDialog = (detail?: IProductDetail) => {
        if (detail) {
            setEditingDetail(detail);
            setFormData({
                productId: detail.product.id.toString(),
                description: detail.description || '',
                ingredient: detail.ingredient || '',
                usageGuide: detail.usageGuide || '',
                specification: detail.specification || '',
            });
        } else {
            setEditingDetail(null);
            setFormData({
                productId: '',
                description: '',
                ingredient: '',
                usageGuide: '',
                specification: '',
            });
        }
        setIsDialogOpen(true);
    };

    const handlePreview = (detail: IProductDetail) => {
        setPreviewDetail(detail);
        setIsPreviewOpen(true);
    };

    const handleSave = async () => {
        if (!formData.productId) {
            toast.error('Vui lòng chọn sản phẩm');
            return;
        }

        try {
            const payload = {
                productId: Number(formData.productId),
                description: formData.description,
                ingredient: formData.ingredient,
                usageGuide: formData.usageGuide,
                specification: formData.specification,
            };

            if (editingDetail) {
                await productDetailService.update({ ...payload, id: editingDetail.id });
                toast.success('Đã cập nhật chi tiết sản phẩm');
            } else {
                await productDetailService.create(payload);
                toast.success('Đã thêm chi tiết sản phẩm mới');
            }
            setIsDialogOpen(false);
            fetchDetails(meta.current, searchTerm);
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Có lỗi xảy ra khi lưu';
            toast.error(msg);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa chi tiết sản phẩm này?')) return;

        try {
            await productDetailService.remove(id);
            toast.success('Đã xóa chi tiết sản phẩm');
            fetchDetails(meta.current, searchTerm);
        } catch {
            toast.error('Không thể xóa chi tiết sản phẩm');
        }
    };

    // Filter available products (only those without details, plus the current one if editing)
    const availableProducts = products.filter(
        (p) => !details.some((d) => d.product.id === p.id) || editingDetail?.product.id === p.id
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Quản lý Chi tiết sản phẩm</h1>
                    <p className="text-muted-foreground">
                        Quản lý mô tả chuyên sâu, thành phần và hướng dẫn sử dụng
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm chi tiết
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm sản phẩm hoặc mô tả..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="pl-10"
                    />
                </div>
                <Button variant="secondary" onClick={handleSearch}>Tìm kiếm</Button>
            </div>

            <div className="border rounded-lg bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sản phẩm</TableHead>
                            <TableHead>Mô tả</TableHead>
                            <TableHead>Thành phần</TableHead>
                            <TableHead>Hướng dẫn</TableHead>
                            <TableHead>Thông số</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                    <p className="mt-2 text-sm text-muted-foreground">Đang tải dữ liệu...</p>
                                </TableCell>
                            </TableRow>
                        ) : details.map((detail) => (
                            <TableRow key={detail.id}>
                                <TableCell className="font-medium max-w-[200px]">
                                    <div className="flex flex-col">
                                        <span>{detail.product?.name}</span>
                                        <span className="text-xs text-muted-foreground">ID Product: {detail.product?.id}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {detail.description ? (
                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                            <FileText className="h-3 w-3 mr-1" />
                                            Đã có
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="opacity-50">Trống</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {detail.ingredient ? (
                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                            <FileText className="h-3 w-3 mr-1" />
                                            Đã có
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="opacity-50">Trống</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {detail.usageGuide ? (
                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                            <FileText className="h-3 w-3 mr-1" />
                                            Đã có
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="opacity-50">Trống</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {detail.specification ? (
                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                            <FileText className="h-3 w-3 mr-1" />
                                            Đã có
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="opacity-50">Trống</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handlePreview(detail)}
                                            className="hover:text-primary"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleOpenDialog(detail)}
                                            className="hover:text-primary"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(detail.id)}
                                            className="hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && details.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                    Chưa có dữ liệu chi tiết sản phẩm nào
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <PaginationControl
                currentPage={meta.current}
                totalPages={meta.pages}
                onPageChange={(page) => fetchDetails(page, searchTerm)}
            />

            {/* Edit/Add Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            {editingDetail ? 'Chỉnh sửa chi tiết sản phẩm' : 'Thêm chi tiết sản phẩm mới'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Chọn sản phẩm liên kết *</Label>
                            <Select
                                value={formData.productId}
                                onValueChange={(value) => setFormData({ ...formData, productId: value })}
                                disabled={!!editingDetail}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Chọn sản phẩm trong kho..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableProducts.map((p) => (
                                        <SelectItem key={p.id} value={p.id.toString()}>
                                            [{p.id}] {p.name} - {p.brand.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-muted-foreground">Mỗi sản phẩm chỉ được có 1 bản chi tiết duy nhất.</p>
                        </div>

                        <Tabs defaultValue="description" className="border rounded-xl p-1">
                            <TabsList className="grid w-full grid-cols-4 bg-muted/50">
                                <TabsTrigger value="description">Mô tả chi tiết</TabsTrigger>
                                <TabsTrigger value="ingredient">Thành phần</TabsTrigger>
                                <TabsTrigger value="usageGuide">Hướng dẫn</TabsTrigger>
                                <TabsTrigger value="specification">Thông số</TabsTrigger>
                            </TabsList>
                            <TabsContent value="description" className="space-y-3 mt-4 px-2">
                                <Label className="text-sm font-medium">Giới thiệu sản phẩm</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Mô tả các đặc điểm nổi bật, công dụng chính..."
                                    className="min-h-[250px] resize-none focus:ring-1"
                                />
                            </TabsContent>
                            <TabsContent value="ingredient" className="space-y-3 mt-4 px-2">
                                <Label className="text-sm font-medium">Bảng thành phần đầy đủ</Label>
                                <Textarea
                                    value={formData.ingredient}
                                    onChange={(e) => setFormData({ ...formData, ingredient: e.target.value })}
                                    placeholder="Liệt kê các thành phần chính hoặc bảng INCI..."
                                    className="min-h-[250px] resize-none focus:ring-1"
                                />
                            </TabsContent>
                            <TabsContent value="usageGuide" className="space-y-3 mt-4 px-2">
                                <Label className="text-sm font-medium">Cách dùng và lưu ý</Label>
                                <Textarea
                                    value={formData.usageGuide}
                                    onChange={(e) => setFormData({ ...formData, usageGuide: e.target.value })}
                                    placeholder="Quy trình sử dụng, liều dùng, đối tượng khuyên dùng..."
                                    className="min-h-[250px] resize-none focus:ring-1"
                                />
                            </TabsContent>
                            <TabsContent value="specification" className="space-y-3 mt-4 px-2">
                                <Label className="text-sm font-medium">Thông số kỹ thuật/khác</Label>
                                <Textarea
                                    value={formData.specification}
                                    onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                                    placeholder="Dung tích, hạn sử dụng, xuất xứ, loại da..."
                                    className="min-h-[250px] resize-none focus:ring-1"
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy bỏ</Button>
                        <Button onClick={handleSave} className="px-8 bg-primary hover:bg-primary/90">
                            {editingDetail ? 'Lưu thay đổi' : 'Tạo mới'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5 text-primary" />
                            Xem trước: {previewDetail?.product?.name}
                        </DialogTitle>
                    </DialogHeader>
                    {previewDetail && (
                        <div className="mt-4 space-y-6">
                            <Tabs defaultValue="description">
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="description">Mô tả</TabsTrigger>
                                    <TabsTrigger value="ingredient">Thành phần</TabsTrigger>
                                    <TabsTrigger value="usageGuide">Hướng dẫn</TabsTrigger>
                                    <TabsTrigger value="specification">Thông số</TabsTrigger>
                                </TabsList>
                                <TabsContent value="description" className="mt-6">
                                    <div className="prose prose-sm max-w-none dark:prose-invert">
                                        {previewDetail.description ? previewDetail.description.split('\n').map((line, i) => (
                                            <p key={i} className="text-muted-foreground leading-relaxed mb-3">
                                                {line}
                                            </p>
                                        )) : <p className="italic text-muted-foreground">Chưa có thông tin</p>}
                                    </div>
                                </TabsContent>
                                <TabsContent value="ingredient" className="mt-6">
                                    <div className="bg-muted/30 p-4 rounded-xl border border-border">
                                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                            {previewDetail.ingredient || 'Chưa có thông tin'}
                                        </p>
                                    </div>
                                </TabsContent>
                                <TabsContent value="usageGuide" className="mt-6">
                                    <div className="space-y-4">
                                        {previewDetail.usageGuide ? previewDetail.usageGuide.split('\n').map((line, i) => (
                                            <div key={i} className="flex gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                                <p className="text-sm text-muted-foreground">{line}</p>
                                            </div>
                                        )) : <p className="italic text-muted-foreground">Chưa có thông tin</p>}
                                    </div>
                                </TabsContent>
                                <TabsContent value="specification" className="mt-6">
                                    <div className="bg-muted p-4 rounded-lg">
                                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap">
                                            {previewDetail.specification || 'Chưa có thông tin'}
                                        </p>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProductDetailManagement;
