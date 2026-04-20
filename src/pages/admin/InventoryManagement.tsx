import React, { useState, useMemo, useEffect } from 'react';
import { Warehouse, Search, AlertTriangle, Package, Edit, ArrowUpDown, History, Settings, RefreshCcw, Loader2, Plus, Minus, Trash2, Filter, FileBarChart2, Zap, XCircle } from 'lucide-react';
import { formatNumberWithDots, parseNumberFromDots } from '../../lib/numberUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/Checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryService } from '../../service/inventoryService';
import type { Inventory, InventoryLog } from '../../service/inventoryService';
import { categoryService } from '../../service/categoryService';
import type { ICategory } from '../../types/category.type';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { Textarea } from '../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { cn } from '../../lib/utils';
import { DATE_MIN, getTodayStr, clampYear } from '../../lib/date';

type StockFilter = 'all' | 'low' | 'out' | 'ok';

const translateLogType = (type: string) => {
    switch (type) {
        case 'PURCHASE': return { label: 'Nhập hàng', color: 'bg-blue-100 text-blue-700 border-blue-200' };
        case 'SALE': return { label: 'Bán hàng', color: 'bg-green-100 text-green-700 border-green-200' };
        case 'ADJUSTMENT': return { label: 'Điều chỉnh', color: 'bg-purple-100 text-purple-700 border-purple-200' };
        case 'RETURN': return { label: 'Trả hàng', color: 'bg-orange-100 text-orange-700 border-orange-200' };
        case 'DAMAGE': return { label: 'Hư hỏng', color: 'bg-red-100 text-red-700 border-red-200' };
        case 'LOSS': return { label: 'Thất thoát', color: 'bg-gray-100 text-gray-700 border-gray-200' };
        case 'RESERVE': return { label: 'Giữ kho', color: 'bg-amber-100 text-amber-700 border-amber-200' };
        case 'RELEASE': return { label: 'Giải phóng', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' };
        default: return { label: type, color: 'bg-muted text-muted-foreground' };
    }
};

const InventoryManagement: React.FC = () => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<StockFilter>('all');
    const [inventoryData, setInventoryData] = useState<Inventory[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [categories, setCategories] = useState<ICategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const toggleSelection = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAll = (items: Inventory[]) => {
        if (selectedIds.length === items.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(items.map(i => i.id));
        }
    };

    // Modal states
    const [historyOpen, setHistoryOpen] = useState(false);
    const [adjustOpen, setAdjustOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
    const [logs, setLogs] = useState<InventoryLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Adjust form state
    const [adjustType, setAdjustType] = useState('ADJUSTMENT');
    const [adjustQty, setAdjustQty] = useState<number | string>(0);
    const [isNegative, setIsNegative] = useState(false);
    const [adjustNote, setAdjustNote] = useState('');
    const [minStock, setMinStock] = useState(10);
    const [maxStock, setMaxStock] = useState(100);
    const [costPrice, setCostPrice] = useState<number | string>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Global History states
    const [globalLogs, setGlobalLogs] = useState<InventoryLog[]>([]);
    const [loadingGlobalLogs, setLoadingGlobalLogs] = useState(false);
    const [logSearch, setLogSearch] = useState('');
    const [logTypeFilter, setLogTypeFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('inventory');
    const [logPage, setLogPage] = useState(1);
    const [logTotal, setLogTotal] = useState(0);
    const logPageSize = 20;
    const [logStartDate, setLogStartDate] = useState('');
    const [logEndDate, setLogEndDate] = useState('');
    const [appliedStartDate, setAppliedStartDate] = useState("");
    const [appliedEndDate, setAppliedEndDate] = useState("");
    const [isExporting, setIsExporting] = useState(false);

    // Bulk adjust state
    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkSearch, setBulkSearch] = useState('');
    const [bulkItems, setBulkItems] = useState<{
        inventoryId: number;
        productId: number;
        variantId: number;
        sku: string;
        name: string;
        thumbnail: string;
        costPrice: number;
        quantity: number;
    }[]>([]);

    useEffect(() => {
        fetchInventory();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await categoryService.getAll(0, 100);
            if (!res.error) {
                setCategories(res.data?.result || []);
            }
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    };

    const fetchGlobalLogs = async () => {
        setLoadingGlobalLogs(true);
        try {
            let query = "";
            if (logSearch) {
                // Assuming backend supports searching product name or SKU via specification
                // The specification format depends on how spring-filter is configured.
                // Usually it's ?filter=inventory.productVariant.product.name~'*search*'
                query += `&filter=inventory.productVariant.product.name~'*${logSearch}*' or inventory.productVariant.sku~'*${logSearch}*' or note~'*${logSearch}*'`;
            }
            if (logTypeFilter !== 'all') {
                query += `&filter=type:'${logTypeFilter}'`;
            }
            if (logStartDate && logStartDate < DATE_MIN) {
                toast.error("Ngày bắt đầu không được nhỏ hơn năm 2000");
                return;
            }
            if (logEndDate && logEndDate < DATE_MIN) {
                toast.error("Ngày kết thúc không được nhỏ hơn năm 2000");
                return;
            }
            if (logStartDate && logEndDate && new Date(logStartDate) > new Date(logEndDate)) {
                toast.error("Ngày bắt đầu không thể lớn hơn ngày kết thúc");
                return;
            }

            if (appliedStartDate) {
                query += `&filter=createdAt >= '${appliedStartDate}T00:00:00Z'`;
            }
            if (appliedEndDate) {
                query += `&filter=createdAt <= '${appliedEndDate}T23:59:59Z'`;
            }

            // Note: Spring Filter specification syntax might need adjustment based on project setup
            // If the above '~' doesn't work, we'll simplify.

            const data = await inventoryService.getInventoryLogsAll(logPage, logPageSize, query);
            setGlobalLogs(data?.result || []);
            setLogTotal(data?.meta.total || 0);
        } catch {
            toast.error('Không thể tải nhật ký kho hàng');
        } finally {
            setLoadingGlobalLogs(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'history') {
            fetchGlobalLogs();
        }
    }, [activeTab, logPage, logPageSize, appliedStartDate, appliedEndDate]); // Added applied filters

    // Debounce search
    useEffect(() => {
        if (activeTab !== 'history') return;
        const timer = setTimeout(() => {
            if (logPage !== 1) setLogPage(1);
            else fetchGlobalLogs();
        }, 500);
        return () => clearTimeout(timer);
    }, [logSearch]);


    const handleExport = async () => {
        try {
            setIsExporting(true);
            let query = "";
            if (logSearch) {
                query += `&filter=(inventory.productVariant.product.name~'*${logSearch}*' or inventory.productVariant.sku~'*${logSearch}*' or note~'*${logSearch}*')`;
            }
            if (logTypeFilter !== 'all') query += `&filter=type:'${logTypeFilter}'`;
            if (appliedStartDate) query += `&filter=createdAt >= '${appliedStartDate}T00:00:00Z'`;
            if (appliedEndDate) query += `&filter=createdAt <= '${appliedEndDate}T23:59:59Z'`;

            const blob = await inventoryService.exportInventoryLogs(query.substring(1));

            // Create download link
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `nhat-ky-kho-${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`);
            document.body.appendChild(link);
            link.click();

            // Cleanup
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success("Đã xuất báo cáo thành công");
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Không thể xuất báo cáo");
        } finally {
            setIsExporting(false);
        }
    };

    const resetLogFilters = () => {
        setLogSearch('');
        setLogTypeFilter('all');
        setLogStartDate('');
        setLogEndDate('');
        setAppliedStartDate('');
        setAppliedEndDate('');
        setLogPage(1);
    };

    const fetchInventory = async (silent: boolean = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await inventoryService.getAllInventory();
            if (Array.isArray(data)) {
                setInventoryData(data);
            } else {
                setInventoryData([]);
            }
        } catch {
            toast.error('Không thể tải dữ liệu kho hàng');
            setInventoryData([]);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const openHistory = async (item: Inventory) => {
        setSelectedItem(item);
        setHistoryOpen(true);
        setLoadingLogs(true);
        try {
            const data = await inventoryService.getInventoryLogs(item.id);
            if (Array.isArray(data)) {
                setLogs(data);
            } else {
                setLogs([]);
            }
        } catch {
            toast.error('Không thể tải lịch sử kho hàng');
            setLogs([]);
        } finally {
            setLoadingLogs(false);
        }
    };

    const openAdjust = (item: Inventory) => {
        setSelectedItem(item);
        setAdjustQty(0);
        setAdjustType('ADJUSTMENT');
        setAdjustNote('');
        setMinStock(item.minStockThreshold);
        setMaxStock(item.maxStock);
        setCostPrice(item.costPrice || 0);
        setAdjustOpen(true);
    };

    const handleAdjustSubmit = async () => {
        if (!selectedItem) return;
        setIsSubmitting(true);
        try {
            const finalQty = isNegative ? -Math.abs(Number(adjustQty)) : Math.abs(Number(adjustQty));
            await inventoryService.adjustInventory({
                productId: selectedItem.productVariant?.product?.id,
                variantId: selectedItem.productVariant?.id || null,
                quantity: finalQty,
                type: adjustType,
                note: adjustNote,
                costPrice: Number(costPrice),
                minStockThreshold: minStock,
                maxStock: maxStock
            });
            toast.success('Cập nhật kho hàng thành công');
            setAdjustOpen(false);
            fetchInventory(true); // Silent refresh
        } catch {
            toast.error('Lỗi khi cập nhật kho hàng');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkSubmit = async () => {
        if (bulkItems.length === 0) return;
        setIsSubmitting(true);
        try {
            const payloads = bulkItems.map(item => ({
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                costPrice: item.costPrice,
                type: 'PURCHASE', // Default for bulk import
                note: adjustNote || 'Nhập kho hàng loạt'
            }));

            await inventoryService.bulkAdjustInventory(payloads);
            toast.success(`Đã nhập kho thành công ${bulkItems.length} mặt hàng`);
            setBulkOpen(false);
            setBulkItems([]);
            setAdjustNote('');
            fetchInventory(true); // Silent refresh
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi khi nhập kho hàng loạt');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkSelected = () => {
        const selectedItems = (inventoryData || []).filter(item => selectedIds.includes(item.id));
        setBulkItems(selectedItems.map(item => ({
            inventoryId: item.id,
            productId: item.productVariant.product.id,
            variantId: item.productVariant.id,
            sku: item.productVariant.sku,
            name: item.productVariant.product.name,
            thumbnail: item.productVariant.product.thumbnail,
            costPrice: item.costPrice || 0,
            quantity: 1
        })));
        setBulkSearch('');
        setAdjustNote('');
        setBulkOpen(true);
    };

    const addBulkItem = (item: Inventory) => {
        if (bulkItems.find(i => i.inventoryId === item.id)) return;
        setBulkItems([...bulkItems, {
            inventoryId: item.id,
            productId: item.productVariant.product.id,
            variantId: item.productVariant.id,
            sku: item.productVariant.sku,
            name: item.productVariant.product.name,
            thumbnail: item.productVariant.product.thumbnail,
            costPrice: item.costPrice || 0,
            quantity: 1
        }]);
    };

    const updateBulkCost = (inventoryId: number, cost: number) => {
        setBulkItems(bulkItems.map(item =>
            item.inventoryId === inventoryId ? { ...item, costPrice: cost } : item
        ));
    };

    const updateBulkQty = (inventoryId: number, qty: number) => {
        setBulkItems(bulkItems.map(item =>
            item.inventoryId === inventoryId ? { ...item, quantity: qty } : item
        ));
    };

    const addLowStockItems = () => {
        const lowStock = (inventoryData || []).filter(item => (item.stock || 0) < (item.minStockThreshold || 0) && (item.stock || 0) > 0);
        const newItems = lowStock.filter(item => !bulkItems.find(bi => bi.inventoryId === item.id));
        if (newItems.length === 0) {
            toast.info('Không có sản phẩm sắp hết hàng mới để thêm');
            return;
        }
        setBulkItems([...bulkItems, ...newItems.map(item => ({
            inventoryId: item.id,
            productId: item.productVariant.product.id,
            variantId: item.productVariant.id,
            sku: item.productVariant.sku,
            name: item.productVariant.product.name,
            thumbnail: item.productVariant.product.thumbnail,
            costPrice: item.costPrice || 0,
            quantity: 1
        }))]);
        toast.success(`Đã thêm ${newItems.length} sản phẩm sắp hết hàng`);
    };

    const addOutOfStockItems = () => {
        const outOfStock = (inventoryData || []).filter(item => (item.stock || 0) === 0);
        const newItems = outOfStock.filter(item => !bulkItems.find(bi => bi.inventoryId === item.id));
        if (newItems.length === 0) {
            toast.info('Không có sản phẩm hết hàng mới để thêm');
            return;
        }
        setBulkItems([...bulkItems, ...newItems.map(item => ({
            inventoryId: item.id,
            productId: item.productVariant.product.id,
            variantId: item.productVariant.id,
            sku: item.productVariant.sku,
            name: item.productVariant.product.name,
            thumbnail: item.productVariant.product.thumbnail,
            costPrice: item.costPrice || 0,
            quantity: 1
        }))]);
        toast.success(`Đã thêm ${newItems.length} sản phẩm đã hết hàng`);
    };

    const removeBulkItem = (inventoryId: number) => {
        setBulkItems(bulkItems.filter(item => item.inventoryId !== inventoryId));
    };

    const filteredBulkSearch = (inventoryData || []).filter(item =>
        item.productVariant.product.name.toLowerCase().includes(bulkSearch.toLowerCase()) ||
        item.productVariant.sku.toLowerCase().includes(bulkSearch.toLowerCase())
    ).slice(0, 5);

    const filtered = useMemo(() => {
        if (!Array.isArray(inventoryData)) return [];
        let data = [...inventoryData];
        if (search) {
            const s = search.toLowerCase();
            data = data.filter(p =>
                p.productVariant?.product?.name?.toLowerCase()?.includes(s) ||
                (p.productVariant?.sku && p.productVariant.sku.toLowerCase().includes(s))
            );
        }



        if (selectedCategory !== 'all') {
            data = data.filter(p => p.productVariant?.product?.categoryName === selectedCategory);
        }

        if (filter === 'low') data = data.filter(p => (p.stock || 0) > 0 && (p.stock || 0) < (p.minStockThreshold || 0));
        if (filter === 'out') data = data.filter(p => (p.stock || 0) === 0);
        if (filter === 'ok') data = data.filter(p => (p.stock || 0) >= (p.minStockThreshold || 0));
        return data;
    }, [inventoryData, search, filter]);

    const getStockStatus = (item: Inventory) => {
        const total = item.stock + item.reservedStock;
        if (item.stock === 0) return { label: 'Hết hàng', variant: 'destructive', color: 'bg-destructive' };
        if (total > (item.maxStock || 100)) return { label: 'Tồn đọng', variant: 'warning', color: 'bg-yellow-500' };
        if (item.stock < (item.minStockThreshold || 10)) return { label: 'Sắp hết', variant: 'warning', color: 'bg-orange-500' };
        return { label: 'Bình thường', variant: 'success', color: 'bg-green-600' };
    };

    const totalAvailable = (filtered || []).reduce((acc: number, item: Inventory) => acc + (item.stock || 0), 0);
    const totalReserved = (filtered || []).reduce((acc: number, item: Inventory) => acc + (item.reservedStock || 0), 0);
    const totalValue = (filtered || []).reduce((acc: number, item: Inventory) => acc + ((item.stock || 0) * (item.costPrice || 0)), 0);
    const lowStockCount = (filtered || []).filter(item => (item.stock || 0) < (item.minStockThreshold || 0) && (item.stock || 0) > 0).length;

    const getStockBadge = (item: Inventory) => {
        const { label, color } = getStockStatus(item);
        return <Badge className={`${color} border-none shadow-sm text-white`}>{label}</Badge>;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Warehouse className="h-6 w-6 text-primary" /> Quản lý kho hàng
                    </h1>
                    <p className="text-muted-foreground">Theo dõi tồn kho và cảnh báo hết hàng tự động</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        className="gap-2"
                        onClick={() => fetchInventory()}
                    >
                        <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
                        Làm mới
                    </Button>
                    <Button
                        className="w-full md:w-auto gap-2 border-none bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-md shadow-pink-200"
                        onClick={() => {
                            setBulkItems([]);
                            setBulkSearch('');
                            setAdjustNote('');
                            setBulkOpen(true);
                        }}
                    >
                        <Package className="h-4 w-4" /> Nhập kho hàng loạt
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-background/50 border h-12 p-1 gap-1">
                    <TabsTrigger value="inventory" className="gap-2 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Warehouse className="h-4 w-4" />
                        Kho hàng
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <History className="h-4 w-4" />
                        Nhật ký biến động
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="inventory" className="space-y-6 outline-none">


                    {/* Summary Cards */}
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                        {[
                            { label: 'Sẵn sàng bán', value: totalAvailable.toLocaleString(), sub: 'Sẵn có trong kho', icon: Package, color: 'text-primary' },
                            { label: 'Đang giữ chỗ', value: totalReserved.toLocaleString(), sub: 'Chờ xác nhận đơn', icon: ArrowUpDown, color: 'text-blue-500' },
                            { label: 'Giá trị tồn kho', value: totalValue.toLocaleString() + ' ₫', sub: 'Tổng vốn kẹt', icon: FileBarChart2, color: 'text-emerald-500' },
                            { label: 'Sắp hết hàng', value: lowStockCount, sub: 'Dưới định mức', icon: AlertTriangle, color: 'text-orange-500' },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Card className="hover:shadow-md transition-shadow cursor-default group overflow-hidden relative">
                                    <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform`}>
                                        <stat.icon className="h-12 w-12" />
                                    </div>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                    </CardHeader>
                                    <CardContent>
                                        <div className={`text-2xl font-bold ${stat.label === 'Sắp hết hàng' && lowStockCount > 10 ? 'text-destructive' : ''}`}>
                                            {stat.value}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{stat.sub}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Filters */}
                    <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                        <CardContent className="pt-6">
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                <div className="relative w-full sm:w-[350px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Tìm kiếm theo tên hoặc mã sản phẩm..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10 h-10 bg-background/50 border-border/50 focus:border-primary"
                                    />
                                </div>

                                <div className="flex gap-2 w-full sm:w-auto">
                                    <AnimatePresence>
                                        {selectedIds.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                            >
                                                <Button
                                                    className="bg-pink-600 hover:bg-pink-700 gap-2 shadow-lg shadow-pink-200 animate-in zoom-in-95"
                                                    onClick={handleBulkSelected}
                                                >
                                                    <Package className="h-4 w-4" />
                                                    Nhập kho ({selectedIds.length})
                                                </Button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                        <SelectTrigger className="w-full sm:w-[150px] h-10">
                                            <SelectValue placeholder="Danh mục" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tất cả danh mục</SelectItem>
                                            {categories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={filter} onValueChange={(v) => setFilter(v as StockFilter)}>
                                        <SelectTrigger className="w-full sm:w-[180px] h-10">
                                            <SelectValue placeholder="Lọc trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tất cả sản phẩm</SelectItem>
                                            <SelectItem value="ok">Còn hàng (Đủ)</SelectItem>
                                            <SelectItem value="low">Sắp hết hàng</SelectItem>
                                            <SelectItem value="out">Đã hết hàng</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => fetchInventory()}>
                                        <RefreshCcw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Inventory Table */}
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-muted/30">
                                        <tr>
                                            <th className="py-4 px-6 w-[50px]">
                                                <Checkbox
                                                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                                                    onCheckedChange={() => toggleAll(filtered)}
                                                />
                                            </th>
                                            <th className="py-4 px-2 text-sm font-semibold text-muted-foreground">Sản phẩm</th>
                                            <th className="py-4 px-4 text-sm font-semibold text-muted-foreground hidden lg:table-cell">Danh mục</th>
                                            <th className="py-4 px-4 text-sm font-semibold text-muted-foreground min-w-[150px]">Kho hàng / Tỷ lệ</th>
                                            <th className="py-4 px-4 text-sm font-semibold text-muted-foreground hidden sm:table-cell">Giá vốn / Tồn</th>
                                            <th className="py-4 px-4 text-sm font-semibold text-muted-foreground">Trạng thái</th>
                                            <th className="py-4 px-6 text-sm font-semibold text-muted-foreground text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <AnimatePresence mode='popLayout'>
                                            {loading ? (
                                                Array.from({ length: 5 }).map((_, i) => (
                                                    <tr key={i} className="border-b last:border-0">
                                                        <td className="py-4 px-6 opacity-50"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></td>
                                                        <td colSpan={5} className="py-8 text-center text-muted-foreground animate-pulse font-medium">Đang tải dữ liệu kho hàng...</td>
                                                    </tr>
                                                ))
                                            ) : filtered.map((item) => {
                                                const status = getStockStatus(item);
                                                const stockPercent = Math.min(100, (item.stock / item.maxStock) * 100);
                                                const reservedPercent = Math.min(100 - stockPercent, (item.reservedStock / item.maxStock) * 100);

                                                return (
                                                    <motion.tr
                                                        layout
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        key={item.id}
                                                        className={cn(
                                                            "border-b last:border-0 hover:bg-muted/50 transition-colors group",
                                                            selectedIds.includes(item.id) && "bg-primary/5 hover:bg-primary/10"
                                                        )}
                                                    >
                                                        <td className="py-4 px-6">
                                                            <Checkbox
                                                                checked={selectedIds.includes(item.id)}
                                                                onCheckedChange={() => toggleSelection(item.id)}
                                                            />
                                                        </td>
                                                        <td className="py-4 px-2">
                                                            <div className="flex items-center gap-4">
                                                                <div className="relative h-14 w-14 shrink-0 transition-transform hover:scale-110 duration-200">
                                                                    <img
                                                                        src={item.productVariant?.product?.thumbnail || "https://placehold.co/100x100?text=P"}
                                                                        alt={item.productVariant?.product?.name}
                                                                        className="h-full w-full rounded-lg object-cover border border-border/50 shadow-md"
                                                                    />
                                                                    {item.stock === 0 && (
                                                                        <div className="absolute inset-0 bg-destructive/10 rounded-lg flex items-center justify-center">
                                                                            <AlertTriangle className="h-4 w-4 text-destructive" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <span className="block text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                                                                        {item.productVariant?.product?.name}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground font-medium">
                                                                        {item.productVariant?.sku && !item.productVariant.sku.startsWith('DEFAULT-')
                                                                            ? `Biến thể: ${item.productVariant.sku}`
                                                                            : 'Sản phẩm cơ bản'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 text-sm text-muted-foreground hidden lg:table-cell">
                                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none font-normal text-[11px]">
                                                                {item.productVariant?.product?.categoryName || 'N/A'}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-4 px-4 min-w-[180px]">
                                                            <div className="space-y-1.5">
                                                                <div className="flex items-center justify-between text-[11px] mb-1">
                                                                    <div className="flex gap-2">
                                                                        <span className="font-bold text-foreground">{item.stock}</span>
                                                                        <span className="text-blue-600 font-semibold opacity-80">({item.reservedStock} held)</span>
                                                                    </div>
                                                                    <span className="text-muted-foreground font-bold opacity-60">MAX: {item.maxStock}</span>
                                                                </div>
                                                                <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden flex shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
                                                                    <div
                                                                        style={{ width: `${stockPercent}%` }}
                                                                        className={`${status.color} h-full transition-all duration-700 ease-out`}
                                                                    />
                                                                    <div
                                                                        style={{ width: `${reservedPercent}%` }}
                                                                        className="bg-blue-400 h-full transition-all duration-700 ease-out opacity-60 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.1)]"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 hidden sm:table-cell">
                                                            <div className="flex flex-col">
                                                                <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">Vốn: {formatNumberWithDots((item.costPrice || 0).toString())} ₫</span>
                                                                <span className="text-xs font-bold text-foreground whitespace-nowrap">Tồn: {formatNumberWithDots(((item.stock || 0) * (item.costPrice || 0)).toString())} ₫</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">{getStockBadge(item)}</td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center justify-end gap-2 transition-opacity">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 border-border/60 transition-colors shadow-sm"
                                                                    title="Xem lịch sử"
                                                                    onClick={() => openHistory(item)}
                                                                >
                                                                    <History className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-primary hover:bg-primary/10 border-border/60 transition-colors shadow-sm"
                                                                    title="Điều chỉnh"
                                                                    onClick={() => openAdjust(item)}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                                {filtered.length === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-20 px-6"
                                    >
                                        <div className="bg-muted/30 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Search className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-medium">Không tìm thấy sản phẩm</h3>
                                        <p className="text-sm text-muted-foreground">Hãy thử thay đổi từ khóa hoặc bộ lọc của bạn</p>
                                        <Button variant="link" onClick={() => { setSearch(''); setFilter('all'); }} className="mt-2">
                                            Xóa tất cả bộ lọc
                                        </Button>
                                    </motion.div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-6 outline-none">
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold uppercase text-blue-600 tracking-wider">Lượt nhập kho</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{globalLogs.filter(l => l.type === 'PURCHASE').length}</div>
                                <p className="text-[10px] text-muted-foreground mt-1">Toàn thời gian</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold uppercase text-green-600 tracking-wider">Lượt bán hàng</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{globalLogs.filter(l => l.type === 'SALE').length}</div>
                                <p className="text-[10px] text-muted-foreground mt-1">Khấu trừ tự động</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold uppercase text-purple-600 tracking-wider">Điều chỉnh khác</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{globalLogs.filter(l => ['ADJUSTMENT', 'DAMAGE', 'LOSS'].includes(l.type || '')).length}</div>
                                <p className="text-[10px] text-muted-foreground mt-1">Kiểm kho & Hư hỏng</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-none shadow-sm">
                        <CardHeader className="pb-3">
                            <div>
                                <CardTitle className="text-lg">Nhật ký biến động tổng hợp</CardTitle>
                                <p className="text-sm text-muted-foreground">Tra cứu chi tiết mọi thay đổi trong kho hàng</p>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Tìm theo sản phẩm, SKU hoặc ghi chú..."
                                        className="pl-9"
                                        value={logSearch}
                                        onChange={(e) => setLogSearch(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2 items-center">
                                    <div className="flex items-center gap-2 bg-muted/30 px-2 py-1 rounded-lg border border-border/50 shadow-sm">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Từ</span>
                                            <Input
                                                type="date"
                                                className="h-7 w-[125px] border-none bg-transparent text-xs p-0 focus-visible:ring-0"
                                                value={logStartDate}
                                                min={DATE_MIN}
                                                max={getTodayStr()}
                                                onChange={(e) => setLogStartDate(clampYear(e.target.value))}
                                            />
                                        </div>
                                        <div className="h-3 w-[1px] bg-border mx-1" />
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Đến</span>
                                            <Input
                                                type="date"
                                                className="h-7 w-[125px] border-none bg-transparent text-xs p-0 focus-visible:ring-0"
                                                value={logEndDate}
                                                min={logStartDate || DATE_MIN}
                                                max={getTodayStr()}
                                                onChange={(e) => setLogEndDate(clampYear(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    <Select value={logTypeFilter} onValueChange={setLogTypeFilter}>
                                        <SelectTrigger className="w-[140px] h-9">
                                            <Filter className="h-3.5 w-3.5 mr-2 opacity-70" />
                                            <SelectValue placeholder="Tất cả loại" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tất cả loại</SelectItem>
                                            <SelectItem value="PURCHASE">Nhập hàng</SelectItem>
                                            <SelectItem value="SALE">Bán hàng</SelectItem>
                                            <SelectItem value="ADJUSTMENT">Điều chỉnh</SelectItem>
                                            <SelectItem value="RETURN">Trả hàng</SelectItem>
                                            <SelectItem value="DAMAGE">Hư hỏng</SelectItem>
                                            <SelectItem value="LOSS">Thất thoát</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={resetLogFilters}
                                        className="h-9 px-3 text-muted-foreground hover:text-foreground"
                                        title="Xóa bộ lọc"
                                    >
                                        <RefreshCcw className="h-4 w-4" />
                                    </Button>

                                    <Button
                                        onClick={() => {
                                            const today = getTodayStr();
                                            if (logStartDate && logStartDate < DATE_MIN) {
                                                toast.error("Ngày bắt đầu không được nhỏ hơn năm 2000");
                                                return;
                                            }
                                            if (logEndDate && logEndDate < DATE_MIN) {
                                                toast.error("Ngày kết thúc không được nhỏ hơn năm 2000");
                                                return;
                                            }
                                            if (logStartDate && logStartDate > today) {
                                                toast.error("Ngày bắt đầu không được lớn hơn hiện tại");
                                                return;
                                            }
                                            if (logEndDate && logEndDate > today) {
                                                toast.error("Ngày kết thúc không được lớn hơn hiện tại");
                                                return;
                                            }
                                            if (logStartDate && logEndDate && new Date(logStartDate) > new Date(logEndDate)) {
                                                toast.error("Ngày bắt đầu không thể lớn hơn ngày kết thúc");
                                                return;
                                            }
                                            setAppliedStartDate(logStartDate);
                                            setAppliedEndDate(logEndDate);
                                            setLogPage(1);
                                            // fetchGlobalLogs will be triggered by applied dates change
                                        }}
                                        className="h-9 gap-2 shadow-sm"
                                    >
                                        <Filter className="h-4 w-4" />
                                        Lọc
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={handleExport}
                                        disabled={isExporting}
                                        className="h-9 gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all duration-200"
                                    >
                                        {isExporting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span className="hidden sm:inline">Đang xuất...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FileBarChart2 className="h-4 w-4 text-primary" />
                                                <span className="hidden sm:inline">Xuất báo cáo</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-xl border overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="p-4 text-left font-semibold">Sản phẩm</th>
                                            <th className="p-4 text-center font-semibold">Biến động</th>
                                            <th className="p-4 text-left font-semibold">Loại</th>
                                            <th className="p-4 text-left font-semibold">Ghi chú</th>
                                            <th className="p-4 text-left font-semibold">Người thực hiện</th>
                                            <th className="p-4 text-right font-semibold">Thời gian</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {loadingGlobalLogs ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <tr key={i}>
                                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                                        Đang tải dữ liệu nhật ký...
                                                    </td>
                                                </tr>
                                            ))
                                        ) : globalLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-20 text-center text-muted-foreground">
                                                    <FileBarChart2 className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                                    Không tìm thấy dữ liệu phù hợp
                                                </td>
                                            </tr>
                                        ) : (
                                            globalLogs.map((log) => {
                                                const { label, color } = translateLogType(log.type);
                                                const product = log.inventory?.productVariant?.product;
                                                return (
                                                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 shrink-0">
                                                                    <img
                                                                        src={product?.thumbnail || "https://placehold.co/40x40"}
                                                                        className="h-full w-full rounded object-cover border"
                                                                        alt=""
                                                                    />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-bold truncate max-w-[200px]">{product?.name || 'N/A'}</p>
                                                                    <p className="text-[10px] text-muted-foreground font-mono">{log.inventory?.productVariant?.sku}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <div className={cn(
                                                                "font-black text-lg",
                                                                log.quantityChange > 0 ? "text-green-600" : log.quantityChange < 0 ? "text-rose-600" : "text-muted-foreground"
                                                            )}>
                                                                {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}
                                                            </div>
                                                            {log.oldCostPrice !== undefined && log.newCostPrice !== undefined && log.oldCostPrice !== log.newCostPrice && (
                                                                <div className="text-[10px] text-orange-600 mt-0.5 font-medium italic">
                                                                    Giá: {formatNumberWithDots(log.oldCostPrice || 0)} → {formatNumberWithDots(log.newCostPrice || 0)}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="p-4">
                                                            <Badge variant="outline" className={cn("text-[10px] font-bold border", color)}>
                                                                {label}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-4 text-xs italic text-muted-foreground max-w-[200px] truncate" title={log.note}>
                                                            {log.note || '-'}
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold border">
                                                                    {log.createdBy?.charAt(0).toUpperCase() || 'A'}
                                                                </div>
                                                                <span className="text-xs font-medium">{log.createdBy || 'Hệ thống'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="text-xs font-medium">
                                                                {new Date(log.createdAt).toLocaleDateString('vi-VN')}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground font-mono">
                                                                {new Date(log.createdAt).toLocaleTimeString('vi-VN')}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination controls */}
                            {logTotal > 0 && (
                                <div className="flex items-center justify-between pt-4 border-t">
                                    <p className="text-xs text-muted-foreground">
                                        Hiển thị {((logPage - 1) * logPageSize) + 1} - {Math.min(logPage * logPageSize, logTotal)} trong tổng số {logTotal} bản ghi
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={logPage === 1 || loadingGlobalLogs}
                                            onClick={() => setLogPage(p => Math.max(1, p - 1))}
                                        >
                                            Trước
                                        </Button>
                                        <div className="flex items-center px-4 text-sm font-bold bg-muted/50 rounded-md">
                                            Trang {logPage} / {Math.ceil(logTotal / logPageSize)}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={logPage >= Math.ceil(logTotal / logPageSize) || loadingGlobalLogs}
                                            onClick={() => setLogPage(p => p + 1)}
                                        >
                                            Tiếp theo
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* History Modal */}
            <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-primary" /> Lịch sử biến động: {selectedItem?.productVariant?.product?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Tất cả các giao dịch nhập/xuất và thay đổi thông số kho hàng
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {loadingLogs ? (
                            <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                <p className="text-sm font-medium">Đang tải lịch sử...</p>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                                Chưa có lịch sử biến động cho sản phẩm này
                            </div>
                        ) : (
                            <div className="relative border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="p-3 font-semibold">Thời gian</th>
                                            <th className="p-3 font-semibold text-center">Thay đổi</th>
                                            <th className="p-3 font-semibold">Loại</th>
                                            <th className="p-3 font-semibold">Ghi chú</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-3 text-muted-foreground whitespace-nowrap">
                                                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className={`font-bold ${log.quantityChange > 0 ? 'text-green-600' : log.quantityChange < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                        {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}
                                                    </div>
                                                    {log.oldCostPrice !== undefined && log.newCostPrice !== undefined && log.oldCostPrice !== log.newCostPrice && (
                                                        <div className="text-[10px] text-orange-600 mt-1 font-medium italic whitespace-nowrap">
                                                            Giá: {formatNumberWithDots(log.oldCostPrice || 0)} → {formatNumberWithDots(log.newCostPrice || 0)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    {(() => {
                                                        const { label, color } = translateLogType(log.type);
                                                        return (
                                                            <Badge variant="outline" className={`text-[10px] font-bold border ${color}`}>
                                                                {label}
                                                            </Badge>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="p-3 text-xs italic opacity-80 max-w-[200px] truncate" title={log.note}>
                                                    {log.note || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Bulk Adjust Modal */}
            <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <div className="p-2 bg-pink-100 rounded-lg">
                                <Package className="h-5 w-5 text-pink-600" />
                            </div>
                            Nhập kho hàng loạt
                        </DialogTitle>
                        <DialogDescription>
                            Tìm kiếm và thêm nhiều sản phẩm để nhập kho nhanh chóng
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden flex flex-col gap-6 p-6 min-h-[400px]">
                        {/* Quick Add Actions */}
                        <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/20">
                            <div className="w-full text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-2">
                                <Zap className="h-3 w-3 text-yellow-500" /> Thêm nhanh sản phẩm cần nhập
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={addLowStockItems}
                                className="h-8 text-[11px] gap-2 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm"
                            >
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Sản phẩm sắp hết ({lowStockCount})
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={addOutOfStockItems}
                                className="h-8 text-[11px] gap-2 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all shadow-sm"
                            >
                                <XCircle className="h-3.5 w-3.5" />
                                Sản phẩm hết hàng ({(inventoryData || []).filter(i => i.stock === 0).length})
                            </Button>
                            {bulkItems.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setBulkItems([])}
                                    className="h-8 text-[11px] gap-2 text-muted-foreground hover:text-destructive transition-all ml-auto"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Xóa tất cả ({bulkItems.length})
                                </Button>
                            )}
                        </div>

                        {/* Search Area */}
                        <div className="relative">
                            <Label className="text-sm font-bold mb-2 flex items-center gap-2">
                                <Search className="h-3.5 w-3.5" /> Tìm sản phẩm theo tên hoặc SKU
                            </Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Gõ tên hoặc mã SKU sản phẩm..."
                                    value={bulkSearch}
                                    onChange={(e) => setBulkSearch(e.target.value)}
                                    className="pl-10 h-11 bg-muted/20 border-border/50 focus:border-primary transition-all rounded-xl"
                                />
                            </div>

                            {bulkSearch && (
                                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-[300px] overflow-y-auto">
                                    {filteredBulkSearch.length > 0 ? (
                                        filteredBulkSearch.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    addBulkItem(item);
                                                    setBulkSearch('');
                                                }}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-primary/5 transition-colors text-left border-b last:border-0 group"
                                            >
                                                <div className="h-10 w-10 rounded bg-muted overflow-hidden flex-shrink-0 border border-border/50 group-hover:scale-105 transition-transform">
                                                    {item.productVariant.product.thumbnail ? (
                                                        <img src={item.productVariant.product.thumbnail} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-primary/10 text-primary">P</div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold truncate group-hover:text-primary transition-colors">{item.productVariant.product.name}</div>
                                                    <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                                        <Badge variant="outline" className="h-4 p-0 px-1.5 text-[9px] uppercase font-mono border-primary/20 bg-primary/5 text-primary">
                                                            {item.productVariant.sku}
                                                        </Badge>
                                                        <span className={cn(
                                                            "font-medium",
                                                            item.stock === 0 ? "text-destructive" : "text-muted-foreground"
                                                        )}>Tồn: {item.stock}</span>
                                                    </div>
                                                </div>
                                                <Plus className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all mr-2" />
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground italic text-sm">
                                            Không tìm thấy sản phẩm nào khớp với "{bulkSearch}"
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Items Table Section */}
                        <div className="flex-1 border rounded-2xl overflow-hidden bg-background shadow-inner flex flex-col border-border/60">
                            <div className="bg-muted/40 p-3 px-6 border-b flex items-center justify-between">
                                <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                                    <Package className="h-3.5 w-3.5" /> Danh sách nhập kho ({bulkItems.length})
                                </span>
                                {bulkItems.length > 0 && (
                                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                        Tổng số lượng: {bulkItems.reduce((acc, item) => acc + item.quantity, 0)}
                                    </span>
                                )}
                            </div>
                            <div className="overflow-y-auto flex-1">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/20 sticky top-0 z-10 backdrop-blur-sm border-b">
                                        <tr>
                                            <th className="p-4 text-left font-semibold text-muted-foreground">Sản phẩm</th>
                                            <th className="p-4 text-center font-semibold text-muted-foreground w-[160px]">Số lượng</th>
                                            <th className="p-4 text-left font-semibold text-muted-foreground w-[150px]">Giá vốn (₫)</th>
                                            <th className="p-4 text-right font-semibold text-muted-foreground w-[60px]">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {bulkItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="p-24 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-4 opacity-40">
                                                        <div className="p-4 bg-muted rounded-full">
                                                            <Package className="h-12 w-12" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="font-bold text-lg">Danh sách đang trống</p>
                                                            <p className="text-xs max-w-[250px] mx-auto">Sử dụng thanh tìm kiếm hoặc nút thêm nhanh phía trên để bắt đầu lập phiếu nhập kho.</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            <AnimatePresence mode='popLayout'>
                                                {bulkItems.map(item => (
                                                    <motion.tr
                                                        layout
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        key={item.inventoryId}
                                                        className="hover:bg-primary/[0.02] transition-colors group"
                                                    >
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-12 w-12 rounded-xl bg-muted overflow-hidden flex-shrink-0 border border-border/50 shadow-sm group-hover:scale-105 transition-transform">
                                                                    {item.thumbnail ? (
                                                                        <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-primary/10 text-primary">P</div>
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="font-bold truncate max-w-[300px] text-foreground group-hover:text-primary transition-colors">{item.name}</div>
                                                                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">SKU: {item.sku}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center justify-center gap-3">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-lg border-border/60 hover:border-primary hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all shadow-sm"
                                                                    onClick={() => updateBulkQty(item.inventoryId, Math.max(1, item.quantity - 1))}
                                                                >
                                                                    <Minus className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <div className="relative group/input">
                                                                    <Input
                                                                        type="number"
                                                                        min="1"
                                                                        value={item.quantity}
                                                                        onChange={(e) => updateBulkQty(item.inventoryId, Math.max(1, parseInt(e.target.value) || 1))}
                                                                        className="w-20 h-9 text-center p-0 font-bold border-none bg-muted/30 focus-visible:ring-1 focus-visible:ring-primary/30 rounded-lg"
                                                                    />
                                                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary/40 rounded-full opacity-0 group-focus-within/input:opacity-100 transition-opacity" />
                                                                </div>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-lg border-border/60 hover:border-primary hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all shadow-sm"
                                                                    onClick={() => updateBulkQty(item.inventoryId, item.quantity + 1)}
                                                                >
                                                                    <Plus className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-1.5">
                                                                <Input
                                                                    type="text"
                                                                    value={formatNumberWithDots(item.costPrice.toString())}
                                                                    onChange={(e) => updateBulkCost(item.inventoryId, Math.abs(Number(parseNumberFromDots(e.target.value))) || 0)}
                                                                    className="w-24 h-9 text-right font-bold bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/30"
                                                                />
                                                                <span className="text-[10px] font-bold text-muted-foreground">₫</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all"
                                                                onClick={() => removeBulkItem(item.inventoryId)}
                                                            >
                                                                <Trash2 className="h-4.5 w-4.5" />
                                                            </Button>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Overall Note */}
                        <div className="space-y-2">
                            <Label className="text-sm font-bold">Ghi chú chung cho lô hàng</Label>
                            <Input
                                placeholder="Ví dụ: Nhập kho đầu tháng 4, Hàng về từ nhà cung cấp X..."
                                value={adjustNote}
                                onChange={(e) => setAdjustNote(e.target.value)}
                                className="bg-muted/20"
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-muted/30 gap-3">
                        <Button variant="ghost" onClick={() => setBulkOpen(false)} disabled={isSubmitting}>
                            Hủy bỏ
                        </Button>
                        <Button
                            className="bg-pink-600 hover:bg-pink-700 min-w-[150px]"
                            onClick={handleBulkSubmit}
                            disabled={isSubmitting || bulkItems.length === 0}
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Package className="h-4 w-4 mr-2" />}
                            Xác nhận nhập kho ({bulkItems.length})
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Adjust Stock Modal */}
            <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-bold text-xl">
                            <Settings className="h-6 w-6 text-primary" /> Điều chỉnh kho hàng
                        </DialogTitle>
                        <DialogDescription className="font-medium text-muted-foreground/80 flex items-center gap-3">
                            <img
                                src={selectedItem?.productVariant?.product?.thumbnail || "https://placehold.co/50x50?text=P"}
                                alt={selectedItem?.productVariant?.product?.name}
                                className="h-10 w-10 rounded-md object-cover border border-border/50 shadow-sm"
                            />
                            <span>
                                Cập nhật số lượng cho: <span className="text-foreground font-bold underline">{selectedItem?.productVariant?.product?.name}</span>
                            </span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-6 px-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    <Settings className="h-3.5 w-3.5 text-muted-foreground" /> Loại điều chỉnh
                                </Label>
                                <Select value={adjustType} onValueChange={setAdjustType}>
                                    <SelectTrigger className="h-11 font-medium bg-muted/20 border-border/60 hover:border-primary/30 transition-all">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ADJUSTMENT">Điều chỉnh kiểm kho</SelectItem>
                                        <SelectItem value="PURCHASE">Nhập hàng mới</SelectItem>
                                        <SelectItem value="RETURN">Khách trả hàng</SelectItem>
                                        <SelectItem value="DAMAGE">Hàng hư hỏng</SelectItem>
                                        <SelectItem value="LOSS">Thất thoát</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-bold">Số lượng thay đổi</Label>
                                <div className="flex flex-col gap-2">
                                    <div className="flex bg-muted/40 p-1 rounded-xl border border-border/40">
                                        <button
                                            type="button"
                                            onClick={() => setIsNegative(false)}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all",
                                                !isNegative ? "bg-white text-green-600 shadow-sm ring-1 ring-black/5" : "text-muted-foreground hover:bg-white/50"
                                            )}
                                        >
                                            <Plus className="h-3.5 w-3.5" /> TĂNG KHO
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsNegative(true)}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all",
                                                isNegative ? "bg-white text-rose-600 shadow-sm ring-1 ring-black/5" : "text-muted-foreground hover:bg-white/50"
                                            )}
                                        >
                                            <Minus className="h-3.5 w-3.5" /> GIẢM KHO
                                        </button>
                                    </div>
                                    <div className="relative group">
                                        <Input
                                            type="text"
                                            value={formatNumberWithDots(adjustQty)}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const rawValue = parseNumberFromDots(val);
                                                setAdjustQty(Math.abs(Number(rawValue)) || 0);
                                            }}
                                            onFocus={(e) => e.target.select()}
                                            className={cn(
                                                "h-12 font-black text-xl text-center transition-all border-2",
                                                isNegative
                                                    ? "bg-rose-50/30 border-rose-100 focus-visible:ring-rose-500/20 focus-visible:border-rose-500 text-rose-700"
                                                    : "bg-green-50/30 border-green-100 focus-visible:ring-green-500/20 focus-visible:border-green-500 text-green-700"
                                            )}
                                            placeholder="0"
                                        />
                                        <div className={cn(
                                            "absolute left-4 top-1/2 -translate-y-1/2 font-black text-2xl pointer-events-none transition-colors",
                                            isNegative ? "text-rose-400" : "text-green-400"
                                        )}>
                                            {isNegative ? '-' : '+'}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-center font-medium text-muted-foreground px-2">
                                        {isNegative
                                            ? "Số lượng hiện tại sẽ bị trừ đi giá trị này"
                                            : "Số lượng hiện tại sẽ được cộng thêm giá trị này"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 p-5 bg-muted/20 rounded-2xl border border-border/50 shadow-inner">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-orange-600 flex items-center gap-1.5">
                                    <AlertTriangle className="h-3.5 w-3.5" /> Ngưỡng báo thấp
                                </Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={minStock}
                                    onChange={(e) => setMinStock(Math.max(0, parseInt(e.target.value) || 0))}
                                    onFocus={(e) => e.target.select()}
                                    className="h-10 font-bold bg-white/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
                                    <ArrowUpDown className="h-3.5 w-3.5" /> Ngưỡng tồn tối đa
                                </Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={maxStock}
                                    onChange={(e) => setMaxStock(Math.max(0, parseInt(e.target.value) || 0))}
                                    onFocus={(e) => e.target.select()}
                                    className="h-10 font-bold bg-white/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                            <Label className="text-sm font-bold flex items-center gap-2 text-primary">
                                <Plus className="h-3.5 w-3.5" /> Cập nhật giá vốn mới (₫)
                            </Label>
                            <div className="relative">
                                <Input
                                    type="text"
                                    value={formatNumberWithDots(costPrice.toString())}
                                    onChange={(e) => setCostPrice(Math.abs(Number(parseNumberFromDots(e.target.value))) || 0)}
                                    className="h-12 font-black text-xl pl-4 pr-10 border-2 border-primary/20 focus-visible:border-primary transition-all bg-white"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">₫</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium italic">
                                * Giá vốn mới sẽ được áp dụng cho toàn bộ số lượng trong kho sau khi điều chỉnh.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold">Ghi chú điều chỉnh</Label>
                            <Textarea
                                placeholder="Nhập lý do điều chỉnh để tiện theo dõi sau này..."
                                value={adjustNote}
                                onChange={(e) => setAdjustNote(e.target.value)}
                                className="resize-none h-24 bg-muted/20 border-border/60 focus-visible:ring-primary/20"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0 p-6 border-t bg-muted/10">
                        <Button variant="ghost" onClick={() => setAdjustOpen(false)} disabled={isSubmitting}>
                            Hủy bỏ
                        </Button>
                        <Button
                            onClick={handleAdjustSubmit}
                            disabled={isSubmitting || (adjustQty === 0 && minStock === selectedItem?.minStockThreshold && maxStock === selectedItem?.maxStock && costPrice === selectedItem?.costPrice)}
                            className="bg-primary hover:bg-primary/90 min-w-[140px] shadow-md shadow-primary/20"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
                            Lưu thay đổi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
};

export default InventoryManagement;
