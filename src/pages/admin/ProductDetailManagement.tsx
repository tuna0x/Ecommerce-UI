import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Eye, Trash2, ArrowUpDown, Search, Loader2, FileText, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import { CheckCircle2, XCircle, MoreHorizontal, LayoutList, FlaskConical, BookOpen, Settings, Package, ImageIcon } from 'lucide-react';
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

    // Calculate completeness percentage for a detail
    const getCompleteness = (detail: IProductDetail) => {
        const fields = [detail.description, detail.ingredient, detail.usageGuide, detail.specification];
        const filled = fields.filter(f => !!f && f.trim().length > 0).length;
        return Math.round((filled / fields.length) * 100);
    };

    // Stats
    const stats = useMemo(() => {
        const total = details.length;
        const complete = details.filter(d => getCompleteness(d) === 100).length;
        const partial = details.filter(d => { const c = getCompleteness(d); return c > 0 && c < 100; }).length;
        const empty = details.filter(d => getCompleteness(d) === 0).length;
        return { total, complete, partial, empty };
    }, [details]);

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
                const productImage = Array.isArray(detail.product?.image)
                    ? detail.product.image[0]
                    : (detail.product?.image || null);

                return (
                    <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                            {productImage ? (
                                <img
                                    src={productImage}
                                    alt={detail.product?.name}
                                    className="w-10 h-10 rounded-lg object-cover shadow-sm border border-border/50"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-lg bg-muted/50 border border-dashed border-border flex items-center justify-center">
                                    <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="font-semibold text-foreground line-clamp-1 text-sm">{detail.product?.name}</span>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal shrink-0">
                                    {brandName}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">ID: {detail.product?.id}</span>
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            id: "completeness",
            header: "Độ hoàn thiện",
            cell: ({ row }) => {
                const detail = row.original;
                const pct = getCompleteness(detail);
                const barColor = pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : pct > 0 ? 'bg-orange-400' : 'bg-muted-foreground/20';
                const textColor = pct === 100 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : pct > 0 ? 'text-orange-500' : 'text-muted-foreground';

                return (
                    <div className="flex items-center gap-3 min-w-[140px]">
                        <div className="flex-1">
                            <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-500", barColor)}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                        <span className={cn("text-xs font-bold tabular-nums min-w-[36px] text-right", textColor)}>
                            {pct}%
                        </span>
                    </div>
                );
            },
        },
        {
            id: "status",
            header: "Chi tiết nội dung",
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

    // Selected product info for dialog header
    const selectedProduct = useMemo(() => {
        if (!formData.productId) return null;
        return products.find(p => p.id.toString() === formData.productId) || null;
    }, [formData.productId, products]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Quản lý Chi tiết sản phẩm</h1>
                            <p className="text-muted-foreground text-sm">
                                Quản lý mô tả chuyên sâu, thành phần và hướng dẫn sử dụng
                            </p>
                        </div>
                    </div>
                </div>
                <Button onClick={() => handleOpenDialog()} className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                    <Plus className="h-4 w-4" />
                    Thêm chi tiết
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.total}</p>
                            <p className="text-xs text-muted-foreground">Tổng chi tiết</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-emerald-600">{stats.complete}</p>
                            <p className="text-xs text-muted-foreground">Hoàn thiện 100%</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-600">{stats.partial}</p>
                            <p className="text-xs text-muted-foreground">Đang hoàn thiện</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">{stats.empty}</p>
                            <p className="text-xs text-muted-foreground">Chưa có nội dung</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
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

            {/* Table */}
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

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0">
                    {/* Dialog Header with product info */}
                    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b px-6 py-4">
                        <DialogHeader>
                            <DialogTitle className="text-xl flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    editingDetail ? "bg-amber-100 dark:bg-amber-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"
                                )}>
                                    {editingDetail
                                        ? <Pencil className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                        : <Plus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    }
                                </div>
                                <div>
                                    <span className="block">
                                        {editingDetail ? 'Chỉnh sửa chi tiết sản phẩm' : 'Thêm chi tiết sản phẩm mới'}
                                    </span>
                                    {selectedProduct && (
                                        <span className="text-sm font-normal text-muted-foreground flex items-center gap-2 mt-0.5">
                                            <Package className="h-3.5 w-3.5" />
                                            {selectedProduct.name}
                                        </span>
                                    )}
                                </div>
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="px-6 py-5 space-y-6">
                        {/* Product Selection */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                                <Package className="h-4 w-4 text-primary" />
                                Chọn sản phẩm liên kết
                                <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={formData.productId}
                                onValueChange={(value) => setFormData({ ...formData, productId: value })}
                                disabled={!!editingDetail}
                            >
                                <SelectTrigger className="w-full h-11">
                                    <SelectValue placeholder="Chọn sản phẩm trong kho..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableProducts.map((p) => {
                                        const brandName = typeof p.brand === 'string' ? p.brand : p.brand?.name || 'No Brand';
                                        const productImage = Array.isArray(p.image) ? p.image[0] : (p.image || null);
                                        return (
                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                <div className="flex items-center gap-2">
                                                    {productImage ? (
                                                        <img src={productImage} alt="" className="w-6 h-6 rounded object-cover" />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                                                            <ImageIcon className="h-3 w-3 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <span>[{p.id}] {p.name} — {brandName}</span>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-muted-foreground">Mỗi sản phẩm chỉ được có 1 bản chi tiết duy nhất.</p>
                        </div>

                        {/* Content Tabs */}
                        <Tabs defaultValue="description" className="border rounded-xl overflow-hidden">
                            <TabsList className="grid w-full grid-cols-4 bg-muted/50 rounded-none border-b h-12">
                                <TabsTrigger value="description" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-all">
                                    <LayoutList className="h-4 w-4" />
                                    Mô tả
                                </TabsTrigger>
                                <TabsTrigger value="ingredient" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-all">
                                    <FlaskConical className="h-4 w-4" />
                                    Thành phần
                                </TabsTrigger>
                                <TabsTrigger value="usageGuide" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-all">
                                    <BookOpen className="h-4 w-4" />
                                    Hướng dẫn
                                </TabsTrigger>
                                <TabsTrigger value="specification" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-all">
                                    <Settings className="h-4 w-4" />
                                    Thông số
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="description" className="space-y-3 p-5 mt-0">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Giới thiệu sản phẩm</Label>
                                    {formData.description && (
                                        <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 border-none">
                                            <CheckCircle2 className="h-3 w-3 mr-1" /> Đã có nội dung
                                        </Badge>
                                    )}
                                </div>
                                <RichEditor
                                    value={formData.description}
                                    onChange={(val) => setFormData({ ...formData, description: val })}
                                    placeholder="Mô tả các đặc điểm nổi bật, công dụng chính..."
                                />
                            </TabsContent>
                            <TabsContent value="ingredient" className="space-y-3 p-5 mt-0">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Bảng thành phần đầy đủ</Label>
                                    {formData.ingredient && (
                                        <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 border-none">
                                            <CheckCircle2 className="h-3 w-3 mr-1" /> Đã có nội dung
                                        </Badge>
                                    )}
                                </div>
                                <RichEditor
                                    value={formData.ingredient}
                                    onChange={(val) => setFormData({ ...formData, ingredient: val })}
                                    placeholder="Liệt kê các thành phần chính hoặc bảng INCI..."
                                />
                            </TabsContent>
                            <TabsContent value="usageGuide" className="space-y-3 p-5 mt-0">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Cách dùng và lưu ý</Label>
                                    {formData.usageGuide && (
                                        <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 border-none">
                                            <CheckCircle2 className="h-3 w-3 mr-1" /> Đã có nội dung
                                        </Badge>
                                    )}
                                </div>
                                <RichEditor
                                    value={formData.usageGuide}
                                    onChange={(val) => setFormData({ ...formData, usageGuide: val })}
                                    placeholder="Quy trình sử dụng, liều dùng, đối tượng khuyên dùng..."
                                />
                            </TabsContent>
                            <TabsContent value="specification" className="space-y-3 p-5 mt-0">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Thông số kỹ thuật/khác</Label>
                                    {formData.specification && (
                                        <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 border-none">
                                            <CheckCircle2 className="h-3 w-3 mr-1" /> Đã có nội dung
                                        </Badge>
                                    )}
                                </div>
                                <RichEditor
                                    value={formData.specification}
                                    onChange={(val) => setFormData({ ...formData, specification: val })}
                                    placeholder="Dung tích, hạn sử dụng, xuất xứ, loại da..."
                                />
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sticky Footer */}
                    <div className="sticky bottom-0 bg-background/95 backdrop-blur-md border-t px-6 py-4 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                            {(() => {
                                const filled = [formData.description, formData.ingredient, formData.usageGuide, formData.specification].filter(f => !!f && f.trim().length > 0).length;
                                return `${filled}/4 mục đã điền`;
                            })()}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy bỏ</Button>
                            <Button onClick={handleSave} className="px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                                {editingDetail ? 'Lưu thay đổi' : 'Tạo mới'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto p-0">
                    {/* Preview Header */}
                    <div className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
                        <div className="relative px-6 py-5 border-b">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-3 text-xl">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Eye className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <span className="block">Xem trước chi tiết</span>
                                        <span className="text-sm font-normal text-muted-foreground flex items-center gap-2 mt-0.5">
                                            <Package className="h-3.5 w-3.5" />
                                            {previewDetail?.product?.name}
                                        </span>
                                    </div>
                                    {previewDetail && (
                                        <div className="ml-auto">
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "text-xs px-3 py-1",
                                                    getCompleteness(previewDetail) === 100
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : "bg-amber-100 text-amber-700"
                                                )}
                                            >
                                                {getCompleteness(previewDetail)}% hoàn thiện
                                            </Badge>
                                        </div>
                                    )}
                                </DialogTitle>
                            </DialogHeader>
                        </div>
                    </div>

                    {previewDetail && (
                        <div className="p-6">
                            <Tabs defaultValue="description">
                                <TabsList className="grid w-full grid-cols-4 mb-6">
                                    <TabsTrigger value="description" className="gap-2">
                                        <LayoutList className="h-4 w-4" />
                                        Mô tả
                                    </TabsTrigger>
                                    <TabsTrigger value="ingredient" className="gap-2">
                                        <FlaskConical className="h-4 w-4" />
                                        Thành phần
                                    </TabsTrigger>
                                    <TabsTrigger value="usageGuide" className="gap-2">
                                        <BookOpen className="h-4 w-4" />
                                        Hướng dẫn
                                    </TabsTrigger>
                                    <TabsTrigger value="specification" className="gap-2">
                                        <Settings className="h-4 w-4" />
                                        Thông số
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="description">
                                    {previewDetail.description ? (
                                        <div
                                            className="prose prose-sm max-w-none dark:prose-invert prose-p:text-muted-foreground prose-p:leading-relaxed prose-headings:text-foreground"
                                            dangerouslySetInnerHTML={{ __html: previewDetail.description }}
                                        />
                                    ) : (
                                        <EmptyPreview label="mô tả" />
                                    )}
                                </TabsContent>
                                <TabsContent value="ingredient">
                                    {previewDetail.ingredient ? (
                                        <div
                                            className="bg-muted/30 p-6 rounded-2xl border border-border prose prose-sm max-w-none dark:prose-invert"
                                            dangerouslySetInnerHTML={{ __html: previewDetail.ingredient }}
                                        />
                                    ) : (
                                        <EmptyPreview label="thành phần" />
                                    )}
                                </TabsContent>
                                <TabsContent value="usageGuide">
                                    {previewDetail.usageGuide ? (
                                        <div
                                            className="prose prose-sm max-w-none dark:prose-invert"
                                            dangerouslySetInnerHTML={{ __html: previewDetail.usageGuide }}
                                        />
                                    ) : (
                                        <EmptyPreview label="hướng dẫn sử dụng" />
                                    )}
                                </TabsContent>
                                <TabsContent value="specification">
                                    {previewDetail.specification ? (
                                        <div
                                            className="bg-muted/20 p-6 rounded-2xl border border-border prose prose-sm max-w-none dark:prose-invert"
                                            dangerouslySetInnerHTML={{ __html: previewDetail.specification }}
                                        />
                                    ) : (
                                        <EmptyPreview label="thông số kỹ thuật" />
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}

                    {/* Preview Footer */}
                    <div className="border-t px-6 py-4 flex items-center justify-between bg-muted/10">
                        <p className="text-xs text-muted-foreground">
                            Đây là bản xem trước nội dung sẽ hiển thị cho khách hàng
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setIsPreviewOpen(false);
                                    if (previewDetail) handleOpenDialog(previewDetail);
                                }}
                            >
                                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                Chỉnh sửa
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => setIsPreviewOpen(false)}>
                                Đóng
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

// Empty state for preview
const EmptyPreview: React.FC<{ label: string }> = ({ label }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <FileText className="h-7 w-7 text-muted-foreground/40" />
        </div>
        <p className="text-sm text-muted-foreground">
            Chưa có thông tin <span className="font-medium">{label}</span>
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
            Hãy thêm nội dung cho mục này trong phần chỉnh sửa
        </p>
    </div>
);

export default ProductDetailManagement;
