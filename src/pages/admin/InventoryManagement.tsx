import React, { useState, useMemo } from 'react';
import { Warehouse, Search, AlertTriangle, CheckCircle, Package, Edit, Eye, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { products } from '../../data/products';
import { Progress } from '../../components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';

type StockFilter = 'all' | 'low' | 'out' | 'ok';

const InventoryManagement: React.FC = () => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<StockFilter>('all');

    const inventoryData = useMemo(() => {
        return products.map(p => ({
            ...p,
            stock: p.stock ?? 15, // Default to 15 to avoid impure Math.random during render
            maxStock: 100,
        }));
    }, []);

    const filtered = useMemo(() => {
        let data = inventoryData;
        if (search) {
            const s = search.toLowerCase();
            data = data.filter(p => p.name.toLowerCase().includes(s) || p.brand.toLowerCase().includes(s));
        }
        if (filter === 'low') data = data.filter(p => p.stock > 0 && p.stock < 10);
        if (filter === 'out') data = data.filter(p => p.stock === 0);
        if (filter === 'ok') data = data.filter(p => p.stock >= 10);
        return data;
    }, [inventoryData, search, filter]);

    const totalStock = inventoryData.reduce((s, p) => s + p.stock, 0);
    const lowStockCount = inventoryData.filter(p => p.stock > 0 && p.stock < 10).length;
    const outOfStockCount = inventoryData.filter(p => p.stock === 0).length;

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

    const getStockBadge = (stock: number) => {
        if (stock === 0) return <Badge variant="destructive" className="animate-pulse">Hết hàng</Badge>;
        if (stock < 10) return <Badge className="bg-orange-500 hover:bg-orange-600 border-none shadow-sm">Sắp hết</Badge>;
        return <Badge className="bg-green-600 hover:bg-green-700 border-none shadow-sm">Còn hàng</Badge>;
    };

    const getStockColor = (stock: number) => {
        if (stock === 0) return 'bg-destructive';
        if (stock < 10) return 'bg-orange-500';
        return 'bg-green-600';
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
                <Button className="w-full md:w-auto gap-2">
                    <Package className="h-4 w-4" /> Nhập kho hàng loạt
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'Tổng tồn kho', value: totalStock.toLocaleString(), sub: `${inventoryData.length} sản phẩm`, icon: Package, color: 'text-primary' },
                    { label: 'Sắp hết hàng', value: lowStockCount, sub: 'Dưới 10 sản phẩm', icon: AlertTriangle, color: 'text-orange-500' },
                    { label: 'Hết hàng', value: outOfStockCount, sub: 'Cần nhập thêm gấp', icon: AlertTriangle, color: 'text-destructive' },
                    { label: 'Đủ hàng', value: inventoryData.filter(p => p.stock >= 10).length, sub: 'Trạng thái tốt', icon: CheckCircle, color: 'text-green-500' },
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
                                <div className={`text-2xl font-bold ${stat.label === 'Hết hàng' && outOfStockCount > 0 ? 'text-destructive' : ''}`}>
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
                        <div className="flex gap-2">
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
                            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                                <ArrowUpDown className="h-4 w-4" />
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
                                    <th className="py-4 px-4 text-sm font-semibold text-muted-foreground hidden md:table-cell">Phân loại</th>
                                    <th className="py-4 px-4 text-sm font-semibold text-muted-foreground hidden sm:table-cell">Đơn giá</th>
                                    <th className="py-4 px-4 text-sm font-semibold text-muted-foreground min-w-[150px]">Kho hàng / Tỷ lệ</th>
                                    <th className="py-4 px-4 text-sm font-semibold text-muted-foreground">Trạng thái</th>
                                    <th className="py-4 px-6 text-sm font-semibold text-muted-foreground text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode='popLayout'>
                                    {filtered.map((product) => (
                                        <motion.tr 
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            key={product.id} 
                                            className="border-b last:border-0 hover:bg-muted/50 transition-colors group"
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative h-12 w-12 shrink-0">
                                                        <img src={product.image} alt={product.name} className="h-full w-full rounded-lg object-cover border border-border/50" />
                                                        {product.stock === 0 && (
                                                            <div className="absolute inset-0 bg-destructive/20 rounded-lg flex items-center justify-center">
                                                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="block text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                                                            {product.name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground uppercase">{product.brand}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-muted-foreground hidden md:table-cell">
                                                <Badge variant="outline" className="font-normal">{product.brand}</Badge>
                                            </td>
                                            <td className="py-4 px-4 text-sm font-medium hidden sm:table-cell">{formatCurrency(product.price)}</td>
                                            <td className="py-4 px-4">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between text-xs mb-1">
                                                        <span className="font-medium">{product.stock} / {product.maxStock}</span>
                                                        <span className="text-muted-foreground">{Math.round((product.stock / product.maxStock) * 100)}%</span>
                                                    </div>
                                                    <Progress
                                                        value={(product.stock / product.maxStock) * 100}
                                                        className={`h-1.5 w-full bg-muted`}
                                                        indicatorClassName={`${getStockColor(product.stock)} transition-all duration-500`}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">{getStockBadge(product.stock)}</td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Chi tiết">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary" title="Sửa kho">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
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
        </motion.div>
    );
};

export default InventoryManagement;
