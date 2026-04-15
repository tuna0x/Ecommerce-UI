import React, { useState, useMemo, useEffect } from 'react';
import { Warehouse, Search, AlertTriangle, Package, Edit, ArrowUpDown, History, Settings, RefreshCcw, Loader2, Plus, Minus, Trash2 } from 'lucide-react';
import { formatNumberWithDots, parseNumberFromDots } from '../../lib/numberUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryService } from '../../service/inventoryService';
import type { Inventory, InventoryLog } from '../../service/inventoryService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { Textarea } from '../../components/ui/textarea';
import { DATE_MIN, getTodayStr, isValidDate } from '../../lib/date';

type StockFilter = 'all' | 'low' | 'out' | 'ok';

const InventoryManagement: React.FC = () => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<StockFilter>('all');
    const [inventoryData, setInventoryData] = useState<Inventory[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [appliedRange, setAppliedRange] = useState({ start: '', end: '' });

    // Modal states
    const [historyOpen, setHistoryOpen] = useState(false);
    const [adjustOpen, setAdjustOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
    const [logs, setLogs] = useState<InventoryLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Adjust form state
    const [adjustType, setAdjustType] = useState('ADJUSTMENT');
    const [adjustQty, setAdjustQty] = useState<number | string>(0);
    const [adjustNote, setAdjustNote] = useState('');
    const [minStock, setMinStock] = useState(10);
    const [maxStock, setMaxStock] = useState(100);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        quantity: number;
    }[]>([]);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        setLoading(true);
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
            setLoading(false);
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
        setAdjustOpen(true);
    };

    const handleAdjustSubmit = async () => {
        if (!selectedItem) return;
        setIsSubmitting(true);
        try {
            await inventoryService.adjustInventory({
                productId: selectedItem.productVariant?.product?.id,
                variantId: selectedItem.productVariant?.id || null,
                quantity: Number(adjustQty) || 0,
                type: adjustType,
                note: adjustNote,
                minStockThreshold: minStock,
                maxStock: maxStock
            });
            toast.success('Cập nhật kho hàng thành công');
            setAdjustOpen(false);
            fetchInventory();
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
                type: 'PURCHASE', // Default for bulk import
                note: adjustNote || 'Nhập kho hàng loạt'
            }));

            await inventoryService.bulkAdjustInventory(payloads);
            toast.success(`Đã nhập kho thành công ${bulkItems.length} mặt hàng`);
            setBulkOpen(false);
            setBulkItems([]);
            setAdjustNote('');
            fetchInventory();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi khi nhập kho hàng loạt');
        } finally {
            setIsSubmitting(false);
        }
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
            quantity: 1
        }]);
    };

    const updateBulkQty = (inventoryId: number, qty: number) => {
        setBulkItems(bulkItems.map(item =>
            item.inventoryId === inventoryId ? { ...item, quantity: qty } : item
        ));
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

        if (appliedRange.start || appliedRange.end) {
            data = data.filter(item => {
                const updatedTime = new Date(item.updatedAt).getTime();
                if (appliedRange.start) {
                    const start = new Date(appliedRange.start).getTime();
                    if (updatedTime < start) return false;
                }
                if (appliedRange.end) {
                    const end = new Date(appliedRange.end);
                    end.setHours(23, 59, 59, 999);
                    if (updatedTime > end.getTime()) return false;
                }
                return true;
            });
        }

        if (filter === 'low') data = data.filter(p => (p.stock || 0) > 0 && (p.stock || 0) < (p.minStockThreshold || 0));
        if (filter === 'out') data = data.filter(p => (p.stock || 0) === 0);
        if (filter === 'ok') data = data.filter(p => (p.stock || 0) >= (p.minStockThreshold || 0));
        return data;
    }, [inventoryData, search, filter, appliedRange]);

    const getStockStatus = (item: Inventory) => {
        const total = item.stock + item.reservedStock;
        if (item.stock === 0) return { label: 'Hết hàng', variant: 'destructive', color: 'bg-destructive' };
        if (total > (item.maxStock || 100)) return { label: 'Tồn đọng', variant: 'warning', color: 'bg-yellow-500' };
        if (item.stock < (item.minStockThreshold || 10)) return { label: 'Sắp hết', variant: 'warning', color: 'bg-orange-500' };
        return { label: 'Bình thường', variant: 'success', color: 'bg-green-600' };
    };

    const totalAvailable = (filtered || []).reduce((acc: number, item: Inventory) => acc + (item.stock || 0), 0);
    const totalReserved = (filtered || []).reduce((acc: number, item: Inventory) => acc + (item.reservedStock || 0), 0);
    const lowStockCount = (filtered || []).filter(item => (item.stock || 0) < (item.minStockThreshold || 0) && (item.stock || 0) > 0).length;

    const getStockBadge = (item: Inventory) => {
        const { label, color } = getStockStatus(item);
        return <Badge className={`${color} border-none shadow-sm text-white`}>{label}</Badge>;
    };

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

            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'Sẵn sàng bán', value: totalAvailable.toLocaleString(), sub: 'Sẵn có trong kho', icon: Package, color: 'text-primary' },
                    { label: 'Đang giữ chỗ', value: totalReserved.toLocaleString(), sub: 'Chờ xác nhận đơn', icon: ArrowUpDown, color: 'text-blue-500' },
                    { label: 'Sắp hết hàng', value: lowStockCount, sub: 'Dưới 10 sản phẩm', icon: AlertTriangle, color: 'text-orange-500' },
                    { label: 'Tồn đọng cao', value: filtered.filter(p => (p.stock + (p.reservedStock || 0)) > p.maxStock).length, sub: 'Vượt định mức', icon: AlertTriangle, color: 'text-yellow-600' },
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
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm theo tên hoặc mã sản phẩm..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 h-10 bg-background/50 border-border/50 focus:border-primary"
                            />
                        </div>
                        <div className="flex flex-col md:flex-row gap-2 flex-1">
                            <div className="flex items-center gap-2 bg-background/50 border border-border/50 rounded-md px-2 h-10 flex-1">
                                <History className="h-4 w-4 text-muted-foreground" />
                                <input
                                    type="date"
                                    value={startDate}
                                    min={DATE_MIN}
                                    max={getTodayStr()}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent border-none text-xs focus:ring-0 outline-none w-full"
                                    placeholder="Từ ngày"
                                />
                                <span className="text-muted-foreground text-xs">→</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    min={DATE_MIN}
                                    max={getTodayStr()}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent border-none text-xs focus:ring-0 outline-none w-full"
                                    placeholder="Đến ngày"
                                />
                                {(startDate || endDate) && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => {
                                            setStartDate('');
                                            setEndDate('');
                                            setAppliedRange({ start: '', end: '' });
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                            <Button
                                variant="secondary"
                                className="h-10 gap-2 border-primary/10 transition-all font-semibold"
                                onClick={() => {
                                    if ((startDate && !isValidDate(startDate)) || (endDate && !isValidDate(endDate))) {
                                        toast.error(`Ngày phải trong khoảng từ năm 2000 đến 2100`);
                                        return;
                                    }
                                    setAppliedRange({ start: startDate, end: endDate });
                                }}
                            >
                                <Search className="h-4 w-4" /> Lọc
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Select value={filter} onValueChange={(v) => setFilter(v as StockFilter)}>
                                <SelectTrigger className="w-full sm:w-[150px] h-10">
                                    <SelectValue placeholder="Lọc trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả sản phẩm</SelectItem>
                                    <SelectItem value="ok">Còn hàng (Đủ)</SelectItem>
                                    <SelectItem value="low">Sắp hết hàng</SelectItem>
                                    <SelectItem value="out">Đã hết hàng</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={fetchInventory}>
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
                                    <th className="py-4 px-6 text-sm font-semibold text-muted-foreground">Sản phẩm</th>
                                    <th className="py-4 px-4 text-sm font-semibold text-muted-foreground hidden md:table-cell">ID</th>
                                    <th className="py-4 px-4 text-sm font-semibold text-muted-foreground min-w-[200px]">Kho hàng / Tỷ lệ</th>
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
                                                <td colSpan={4} className="py-8 text-center text-muted-foreground animate-pulse font-medium">Đang tải dữ liệu kho hàng...</td>
                                            </tr>
                                        ))
                                    ) : filtered.map((item) => {
                                        const status = getStockStatus(item);
                                        const total = item.stock + item.reservedStock;
                                        const stockPercent = Math.min(100, (item.stock / item.maxStock) * 100);
                                        const reservedPercent = Math.min(100 - stockPercent, (item.reservedStock / item.maxStock) * 100);

                                        return (
                                            <motion.tr
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                key={item.id}
                                                className="border-b last:border-0 hover:bg-muted/50 transition-colors group"
                                            >
                                                <td className="py-4 px-6">
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
                                                <td className="py-4 px-4 text-sm text-muted-foreground hidden md:table-cell">
                                                    <Badge variant="secondary" className="font-normal text-[10px] py-0 px-2 h-5">
                                                        #{item.id}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-4 min-w-[200px]">
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center justify-between text-xs mb-1">
                                                            <div className="flex gap-2">
                                                                <span className="font-bold text-foreground">{item.stock}</span>
                                                                <span className="text-blue-600 font-semibold opacity-80">({item.reservedStock} held)</span>
                                                            </div>
                                                            <span className="text-muted-foreground font-bold opacity-60">MAX: {item.maxStock}</span>
                                                        </div>
                                                        <div className="relative h-2.5 w-full bg-muted rounded-full overflow-hidden flex shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
                                                            <div
                                                                style={{ width: `${stockPercent}%` }}
                                                                className={`${status.color} h-full transition-all duration-700 ease-out`}
                                                            />
                                                            <div
                                                                style={{ width: `${reservedPercent}%` }}
                                                                className="bg-blue-400 h-full transition-all duration-700 ease-out opacity-60 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.1)]"
                                                            />
                                                        </div>
                                                        {total > item.maxStock && (
                                                            <p className="text-[10px] text-yellow-600 font-bold flex items-center gap-1 mt-1 animate-pulse">
                                                                <AlertTriangle className="h-3 w-3" /> CẢNH BÁO TỒN ĐỌNG CAO
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">{getStockBadge(item)}</td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center justify-end gap-2">
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
                                                <td className={`p-3 text-center font-bold ${log.quantityChange > 0 ? 'text-green-600' : log.quantityChange < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                    {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}
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
                        {/* Search Area */}
                        <div className="relative">
                            <Label className="text-sm font-bold mb-2 block">Tìm sản phẩm để thêm vào danh sách</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Tìm theo tên hoặc SKU..."
                                    value={bulkSearch}
                                    onChange={(e) => setBulkSearch(e.target.value)}
                                    className="pl-10 h-11 bg-muted/20"
                                />
                            </div>

                            {bulkSearch && filteredBulkSearch.length > 0 && (
                                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    {filteredBulkSearch.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                addBulkItem(item);
                                                setBulkSearch('');
                                            }}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left border-b last:border-0"
                                        >
                                            <div className="h-10 w-10 rounded bg-muted overflow-hidden flex-shrink-0">
                                                {item.productVariant.product.thumbnail ? (
                                                    <img src={item.productVariant.product.thumbnail} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-primary/10 text-primary">P</div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold truncate">{item.productVariant.product.name}</div>
                                                <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                                                    <Badge variant="outline" className="h-4 p-0 px-1 text-[9px] uppercase">{item.productVariant.sku}</Badge>
                                                    <span>Tồn: {item.stock}</span>
                                                </div>
                                            </div>
                                            <Plus className="h-4 w-4 text-primary" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Items Table */}
                        <div className="flex-1 border rounded-xl overflow-hidden bg-muted/5 flex flex-col">
                            <div className="overflow-y-auto flex-1">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 sticky top-0 z-10">
                                        <tr>
                                            <th className="p-3 text-left font-semibold">Sản phẩm</th>
                                            <th className="p-3 text-center font-semibold w-[150px]">Số lượng nhập</th>
                                            <th className="p-3 text-right font-semibold w-[50px]"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {bulkItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="p-20 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-2 opacity-50">
                                                        <Package className="h-10 w-10" />
                                                        <p>Danh sách nhập kho đang trống</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            bulkItems.map(item => (
                                                <tr key={item.inventoryId} className="hover:bg-muted/20">
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded bg-muted overflow-hidden flex-shrink-0">
                                                                {item.thumbnail ? (
                                                                    <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-primary/10 text-primary">P</div>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-bold truncate max-w-[300px]">{item.name}</div>
                                                                <div className="text-[10px] text-muted-foreground">{item.sku}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-full"
                                                                onClick={() => updateBulkQty(item.inventoryId, Math.max(1, item.quantity - 1))}
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                            </Button>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => updateBulkQty(item.inventoryId, Math.max(1, parseInt(e.target.value) || 1))}
                                                                className="w-16 h-8 text-center p-0 font-bold border-none bg-transparent"
                                                            />
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-full"
                                                                onClick={() => updateBulkQty(item.inventoryId, item.quantity + 1)}
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                            onClick={() => removeBulkItem(item.inventoryId)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold flex items-center gap-1.5">
                                    <Package className="h-3.5 w-3.5" /> Loại điều chỉnh
                                </Label>
                                <Select value={adjustType} onValueChange={setAdjustType}>
                                    <SelectTrigger className="font-medium bg-muted/30">
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
                            <div className="space-y-2">
                                <Label className="text-sm font-bold">Số lượng thay đổi</Label>
                                <Input
                                    type="text"
                                    value={formatNumberWithDots(adjustQty)}
                                    onChange={(e) => {
                                        const rawValue = parseNumberFromDots(e.target.value);
                                        // Handle negative numbers if the user types '-'
                                        if (e.target.value.startsWith('-')) {
                                            setAdjustQty(rawValue !== 0 ? -Math.abs(rawValue) : '-');
                                        } else {
                                            setAdjustQty(rawValue);
                                        }
                                    }}
                                    onFocus={(e) => e.target.select()}
                                    className="font-bold bg-muted/30"
                                    placeholder="Ví dụ: 1.000 hoặc -500"
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">Sử dụng số âm (-) để giảm kho</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-xl border border-border/50">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-orange-600 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" /> Ngưỡng báo thấp
                                </Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={minStock}
                                    onChange={(e) => setMinStock(Math.max(0, parseInt(e.target.value) || 0))}
                                    onFocus={(e) => e.target.select()}
                                    className="h-9 font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-blue-600 flex items-center gap-1">
                                    <RefreshCcw className="h-3 w-3" /> Ngưỡng tồn tối đa
                                </Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={maxStock}
                                    onChange={(e) => setMaxStock(Math.max(0, parseInt(e.target.value) || 0))}
                                    onFocus={(e) => e.target.select()}
                                    className="h-9 font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold">Ghi chú điều chỉnh</Label>
                            <Textarea
                                placeholder="Lý do điều chỉnh kho..."
                                value={adjustNote}
                                onChange={(e) => setAdjustNote(e.target.value)}
                                className="resize-none h-20 bg-muted/30"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setAdjustOpen(false)} disabled={isSubmitting}>
                            Hủy bỏ
                        </Button>
                        <Button
                            onClick={handleAdjustSubmit}
                            disabled={isSubmitting || (adjustQty === 0 && minStock === selectedItem?.minStockThreshold && maxStock === selectedItem?.maxStock)}
                            className="bg-primary hover:bg-primary/90 min-w-[120px]"
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
