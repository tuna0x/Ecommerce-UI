import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Eye, Trash2, ArrowUpDown, Search, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
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
import RichEditor from '../../components/admin/RichEditor';
import { DataTable } from '../../components/ui/data-table';
import { Checkbox } from '../../components/ui/Checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, XCircle, MoreHorizontal, LayoutList, FlaskConical, BookOpen, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

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
            const res = await ProductService.getAll(0, 100); 
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

    const handleSearch = useCallback(() => {
        fetchDetails(1, searchTerm);
    }, [fetchDetails, searchTerm]);

    const handleOpenDialog = useCallback((detail?: IProductDetail) => {
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
    }, []);

    // Auto-open form from query param
    useEffect(() => {
        if (productIdFromQuery && products.length > 0) {
            const existingDetail = details.find(d => d.product.id.toString() === productIdFromQuery);
            if (existingDetail) {
                handleOpenDialog(existingDetail);
            } else {
                const product = products.find(p => p.id.toString() === productIdFromQuery);
                if (product) {
                    handleOpenDialog();
                    setFormData(prev => ({ ...prev, productId: product.id.toString() }));
                }
            }
        }
    }, [productIdFromQuery, products, details, handleOpenDialog]);

    const handlePreview = useCallback((detail: IProductDetail) => {
        setPreviewDetail(detail);
        setIsPreviewOpen(true);
    }, []);

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
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            const msg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu';
            toast.error(msg);
        }
    };

    const handleDelete = useCallback(async (id: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa chi tiết sản phẩm này?')) return;

        try {
            await productDetailService.remove(id);
            toast.success('Đã xóa chi tiết sản phẩm');
            fetchDetails(meta.current);
        } catch {
            toast.error('Không thể xóa chi tiết sản phẩm');
        }
    }, [fetchDetails, meta]);

    // Filter available products (only those without details, plus the current one if editing)
    const availableProducts = products.filter(
        (p) => !details.some((d) => d.product.id === p.id) || editingDetail?.product.id === p.id
    );

    const handleBulkDelete = useCallback(async (selectedRows: IProductDetail[]) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedRows.length} chi tiết sản phẩm đã chọn?`)) return;
        
        try {
            setLoading(true);
            await Promise.all(selectedRows.map(row => productDetailService.remove(row.id)));
            toast.success(`Đã xóa ${selectedRows.length} chi tiết sản phẩm`);
            fetchDetails(meta.current, searchTerm);
        } catch {
            toast.error('Có lỗi xảy ra khi xóa hàng loạt');
        } finally {
            setLoading(false);
        }
    }, [fetchDetails, meta, searchTerm]);

    const StatusIcon = ({ exists, icon: Icon, label }: { exists: boolean, icon: React.ElementType, label: string }) => (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors hover:bg-muted/50 group">
            {exists ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
                <XCircle className="h-3.5 w-3.5 text-muted-foreground/40" />
            )}
            <Icon className={cn("h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors", !exists && "opacity-40")} />
            <span className={cn("text-[11px] font-medium transition-colors", exists ? "text-foreground" : "text-muted-foreground opacity-50")}>
                {label}
            </span>
        </div>
    );

    const columns: ColumnDef<IProductDetail>[] = useMemo(() => [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "id",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="px-0 hover:bg-transparent"
                    >
                        ID
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                );
            },
            cell: ({ row }) => <div className="font-mono text-xs text-muted-foreground">#{row.getValue("id")}</div>,
        },
        {
            accessorKey: "product.name",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="px-0 hover:bg-transparent"
                    >
                        Sản phẩm
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                );
            },
            cell: ({ row }) => {
                const detail = row.original;
                const brandName = typeof detail.product?.brand === 'string' 
                    ? detail.product.brand 
                    : (detail.product?.brand as { name: string } | undefined)?.name || 'No Brand';
                return (
                    <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground line-clamp-1">{detail.product?.name}</span>
                        <div className="flex items-center gap-2">
                             <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                                {brandName}
                             </Badge>
                             <span className="text-[10px] text-muted-foreground">ID: {detail.product?.id}</span>
                        </div>
                    </div>
                );
            },
        },
        {
            id: "status",
            header: "Độ đầy đủ thông tin",
            cell: ({ row }) => {
                const detail = row.original;
                return (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-fit">
                        <StatusIcon exists={!!detail.description} icon={LayoutList} label="Mô tả" />
                        <StatusIcon exists={!!detail.ingredient} icon={FlaskConical} label="Thành phần" />
                        <StatusIcon exists={!!detail.usageGuide} icon={BookOpen} label="Hướng dẫn" />
                        <StatusIcon exists={!!detail.specification} icon={Settings} label="Thông số" />
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: () => <div className="text-right">Thao tác</div>,
            cell: ({ row }) => {
                const detail = row.original;
                return (
                    <div className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                                <DropdownMenuLabel>Tùy chọn</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handlePreview(detail)}>
                                    <Eye className="mr-2 h-4 w-4" /> Xem trước
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenDialog(detail)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    onClick={() => handleDelete(detail.id)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Xóa chi tiết
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ], [handlePreview, handleOpenDialog, handleDelete]);

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
                <div className="relative flex-1 max-sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm sản phẩm hoặc mô tả..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="pl-10"
                    />
                </div>
                <Button variant="secondary" onClick={handleSearch} disabled={loading}>
                    Tìm kiếm
                </Button>
            </div>

            <div className="relative">
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center -top-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                )}
                <DataTable
                columns={columns}
                data={details}
                onDeleteSelected={handleBulkDelete}
                currentPage={meta.current}
                totalPages={meta.pages}
                onPageChange={(page) => fetchDetails(page, searchTerm)}
            />
          </div>

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
                                    {availableProducts.map((p) => {
                                        const brandName = typeof p.brand === 'string' ? p.brand : p.brand?.name || 'No Brand';
                                        return (
                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                [{p.id}] {p.name} - {brandName}
                                            </SelectItem>
                                        );
                                    })}
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
                                <RichEditor
                                    value={formData.description}
                                    onChange={(val) => setFormData({ ...formData, description: val })}
                                    placeholder="Mô tả các đặc điểm nổi bật, công dụng chính..."
                                />
                            </TabsContent>
                            <TabsContent value="ingredient" className="space-y-3 mt-4 px-2">
                                <Label className="text-sm font-medium">Bảng thành phần đầy đủ</Label>
                                <RichEditor
                                    value={formData.ingredient}
                                    onChange={(val) => setFormData({ ...formData, ingredient: val })}
                                    placeholder="Liệt kê các thành phần chính hoặc bảng INCI..."
                                />
                            </TabsContent>
                            <TabsContent value="usageGuide" className="space-y-3 mt-4 px-2">
                                <Label className="text-sm font-medium">Cách dùng và lưu ý</Label>
                                <RichEditor
                                    value={formData.usageGuide}
                                    onChange={(val) => setFormData({ ...formData, usageGuide: val })}
                                    placeholder="Quy trình sử dụng, liều dùng, đối tượng khuyên dùng..."
                                />
                            </TabsContent>
                            <TabsContent value="specification" className="space-y-3 mt-4 px-2">
                                <Label className="text-sm font-medium">Thông số kỹ thuật/khác</Label>
                                <RichEditor
                                    value={formData.specification}
                                    onChange={(val) => setFormData({ ...formData, specification: val })}
                                    placeholder="Dung tích, hạn sử dụng, xuất xứ, loại da..."
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
                                    <div 
                                        className="prose prose-sm max-w-none dark:prose-invert prose-p:text-muted-foreground prose-p:leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: previewDetail.description || '<p class="italic text-muted-foreground">Chưa có thông tin</p>' }}
                                    />
                                </TabsContent>
                                <TabsContent value="ingredient" className="mt-6">
                                    <div 
                                        className="bg-muted/30 p-6 rounded-2xl border border-border prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: previewDetail.ingredient || 'Chưa có thông tin' }}
                                    />
                                </TabsContent>
                                <TabsContent value="usageGuide" className="mt-6">
                                    <div 
                                        className="prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: previewDetail.usageGuide || 'Chưa có thông tin' }}
                                    />
                                </TabsContent>
                                <TabsContent value="specification" className="mt-6">
                                    <div 
                                        className="bg-muted p-6 rounded-2xl prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: previewDetail.specification || 'Chưa có thông tin' }}
                                    />
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
