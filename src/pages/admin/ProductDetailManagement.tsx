import React, { useState } from 'react';
import { Search, Pencil, Plus, Eye, FileText } from 'lucide-react';
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
import { products } from '../../data/products';
import { mockProductDetails, ProductDetailContent } from '../../data/mockProductDetails';
import { usePagination } from '../../hooks/usePagination';
import PaginationControl from '../../components/PaginationControl';
import { toast } from 'sonner';

const ProductDetailManagement: React.FC = () => {
    const [details, setDetails] = useState<ProductDetailContent[]>(mockProductDetails);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [editingDetail, setEditingDetail] = useState<ProductDetailContent | null>(null);
    const [previewDetail, setPreviewDetail] = useState<ProductDetailContent | null>(null);
    const [formData, setFormData] = useState({
        productId: '',
        description: '',
        ingredients: '',
        usage: '',
    });

    const filteredDetails = details.filter(
        (d) =>
            d.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.productId.toString().includes(searchTerm)
    );

    const { currentPage, totalPages, paginatedItems, goToPage } = usePagination(filteredDetails, 8);

    // Products that don't have detail content yet
    const availableProducts = products.filter(
        (p) => !details.some((d) => d.productId === p.id) || editingDetail?.productId === p.id
    );

    const handleOpenDialog = (detail?: ProductDetailContent) => {
        if (detail) {
            setEditingDetail(detail);
            setFormData({
                productId: detail.productId.toString(),
                description: detail.description,
                ingredients: detail.ingredients,
                usage: detail.usage,
            });
        } else {
            setEditingDetail(null);
            setFormData({ productId: '', description: '', ingredients: '', usage: '' });
        }
        setIsDialogOpen(true);
    };

    const handlePreview = (detail: ProductDetailContent) => {
        setPreviewDetail(detail);
        setIsPreviewOpen(true);
    };

    const handleSave = () => {
        if (!formData.productId) {
            toast.error('Vui lòng chọn sản phẩm');
            return;
        }

        const product = products.find((p) => p.id === Number(formData.productId));
        if (!product) return;

        if (editingDetail) {
            setDetails(
                details.map((d) =>
                    d.id === editingDetail.id
                        ? {
                            ...d,
                            productId: Number(formData.productId),
                            productName: product.name,
                            description: formData.description,
                            ingredients: formData.ingredients,
                            usage: formData.usage,
                            updatedAt: new Date().toISOString().split('T')[0],
                        }
                        : d
                )
            );
            toast.success('Đã cập nhật chi tiết sản phẩm');
        } else {
            const newDetail: ProductDetailContent = {
                id: Date.now().toString(),
                productId: Number(formData.productId),
                productName: product.name,
                description: formData.description,
                ingredients: formData.ingredients,
                usage: formData.usage,
                updatedAt: new Date().toISOString().split('T')[0],
            };
            setDetails([...details, newDetail]);
            toast.success('Đã thêm chi tiết sản phẩm mới');
        }
        setIsDialogOpen(false);
    };

    const handleDelete = (id: string) => {
        setDetails(details.filter((d) => d.id !== id));
        toast.success('Đã xóa chi tiết sản phẩm');
    };

    const truncateText = (text: string, maxLength: number = 60) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Quản lý Chi tiết sản phẩm</h1>
                    <p className="text-muted-foreground">
                        Quản lý mô tả, thành phần và hướng dẫn sử dụng
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
                        placeholder="Tìm kiếm theo tên sản phẩm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sản phẩm</TableHead>
                            <TableHead>Mô tả</TableHead>
                            <TableHead>Thành phần</TableHead>
                            <TableHead>Hướng dẫn</TableHead>
                            <TableHead>Cập nhật</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedItems.map((detail) => (
                            <TableRow key={detail.id}>
                                <TableCell className="font-medium max-w-[200px]">
                                    {detail.productName}
                                </TableCell>
                                <TableCell className="max-w-[150px]">
                                    {detail.description ? (
                                        <Badge variant="outline" className="text-xs">
                                            <FileText className="h-3 w-3 mr-1" />
                                            Đã có
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="text-xs">Chưa có</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {detail.ingredients ? (
                                        <Badge variant="outline" className="text-xs">
                                            <FileText className="h-3 w-3 mr-1" />
                                            Đã có
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="text-xs">Chưa có</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {detail.usage ? (
                                        <Badge variant="outline" className="text-xs">
                                            <FileText className="h-3 w-3 mr-1" />
                                            Đã có
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="text-xs">Chưa có</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {detail.updatedAt}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handlePreview(detail)}
                                            title="Xem trước"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleOpenDialog(detail)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(detail.id)}
                                        >
                                            <FileText className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {paginatedItems.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Chưa có dữ liệu chi tiết sản phẩm
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <PaginationControl currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />

            {/* Edit/Add Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingDetail ? 'Sửa chi tiết sản phẩm' : 'Thêm chi tiết sản phẩm'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Sản phẩm *</Label>
                            <Select
                                value={formData.productId}
                                onValueChange={(value) => setFormData({ ...formData, productId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn sản phẩm" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(editingDetail ? products : availableProducts).map((p) => (
                                        <SelectItem key={p.id} value={p.id.toString()}>
                                            {p.name} - {p.brand}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Tabs defaultValue="description">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="description">Mô tả</TabsTrigger>
                                <TabsTrigger value="ingredients">Thành phần</TabsTrigger>
                                <TabsTrigger value="usage">Hướng dẫn SD</TabsTrigger>
                            </TabsList>
                            <TabsContent value="description" className="space-y-2 mt-3">
                                <Label>Mô tả sản phẩm</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Nhập mô tả chi tiết sản phẩm. Hỗ trợ xuống dòng."
                                    rows={10}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Mẹo: Dùng dấu gạch đầu dòng (-) để tạo danh sách
                                </p>
                            </TabsContent>
                            <TabsContent value="ingredients" className="space-y-2 mt-3">
                                <Label>Thành phần sản phẩm</Label>
                                <Textarea
                                    value={formData.ingredients}
                                    onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                                    placeholder="Liệt kê thành phần sản phẩm (INCI list)..."
                                    rows={10}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Nhập danh sách thành phần theo tiêu chuẩn INCI
                                </p>
                            </TabsContent>
                            <TabsContent value="usage" className="space-y-2 mt-3">
                                <Label>Hướng dẫn sử dụng</Label>
                                <Textarea
                                    value={formData.usage}
                                    onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
                                    placeholder="Nhập hướng dẫn sử dụng sản phẩm. Mỗi bước trên 1 dòng."
                                    rows={10}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Mẹo: Đánh số các bước (1. 2. 3.) để dễ đọc hơn
                                </p>
                            </TabsContent>
                        </Tabs>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleSave}>
                            {editingDetail ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Xem trước: {previewDetail?.productName}</DialogTitle>
                    </DialogHeader>
                    {previewDetail && (
                        <Tabs defaultValue="description">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="description">Mô tả</TabsTrigger>
                                <TabsTrigger value="ingredients">Thành phần</TabsTrigger>
                                <TabsTrigger value="usage">Hướng dẫn SD</TabsTrigger>
                            </TabsList>
                            <TabsContent value="description" className="mt-4">
                                <div className="prose prose-sm max-w-none">
                                    {previewDetail.description.split('\n').map((line, i) => (
                                        <p key={i} className="text-muted-foreground leading-relaxed mb-1">
                                            {line}
                                        </p>
                                    ))}
                                </div>
                            </TabsContent>
                            <TabsContent value="ingredients" className="mt-4">
                                <div className="prose prose-sm max-w-none">
                                    <p className="text-muted-foreground leading-relaxed">
                                        {previewDetail.ingredients}
                                    </p>
                                </div>
                            </TabsContent>
                            <TabsContent value="usage" className="mt-4">
                                <div className="prose prose-sm max-w-none">
                                    {previewDetail.usage.split('\n').map((line, i) => (
                                        <p key={i} className="text-muted-foreground leading-relaxed mb-1">
                                            {line}
                                        </p>
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProductDetailManagement;
