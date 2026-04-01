import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Shield, RotateCcw, Star } from 'lucide-react';
// import { Product, products, brands } from '@/data/products';

interface ProductDetailSidebarProps {
    product: Product;
}

const ProductDetailSidebar: React.FC<ProductDetailSidebarProps> = ({ product }) => {
    const brand = brands.find((b) => b.name === product.brand);

    const sameBrandProducts = useMemo(() => {
        return products
            .filter((p) => p.brand === product.brand && p.id !== product.id)
            .slice(0, 4);
    }, [product]);

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('vi-VN').format(price);

    return (
        <div className="space-y-4">
            {/* Shipping Benefits */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h3 className="font-bold text-sm text-foreground border-b border-border pb-2 text-center tracking-wide">
                    — MIỄN PHÍ VẬN CHUYỂN —
                </h3>
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">Giao Nhanh Miễn Phí 2H</p>
                        <p className="text-xs text-muted-foreground">Trẻ tặng 100K</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">Hàng Chính Hãng 100%</p>
                        <p className="text-xs text-muted-foreground">Đền bù 100% nếu phát hiện hàng giả</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">Giao Hàng Miễn Phí</p>
                        <p className="text-xs text-muted-foreground">Từ 90K tại 60 Tỉnh Thành, toàn Quốc từ 249K</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <RotateCcw className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">Đổi Trả Miễn Phí</p>
                        <p className="text-xs text-muted-foreground">Đổi trả trong <strong>30 ngày</strong></p>
                    </div>
                </div>
            </div>

            {/* Brand Card */}
            {brand && (
                <div className="bg-card border border-border rounded-xl p-5 flex flex-col items-center gap-3">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-secondary/30 border border-border">
                        <img
                            src={brand.logo}
                            alt={brand.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <p className="font-bold text-foreground text-lg">{brand.name}</p>
                    <Link
                        to={`/search?brand=${encodeURIComponent(brand.name)}`}
                        className="bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        Xem thương hiệu
                    </Link>
                </div>
            )}

            {/* Same Brand Products */}
            {sameBrandProducts.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="font-bold text-foreground mb-4">Sản phẩm cùng hãng</h3>
                    <div className="space-y-3">
                        {sameBrandProducts.map((p) => (
                            <Link
                                key={p.id}
                                to={`/product/${p.id}`}
                                className="flex gap-3 group"
                            >
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary/30 shrink-0 relative">
                                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                    {p.discount > 0 && (
                                        <span className="absolute top-0.5 left-0.5 bg-primary text-primary-foreground text-[10px] font-bold px-1 rounded">
                                            -{p.discount}%
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                                        {p.name}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="text-sm font-bold text-primary">{formatPrice(p.price)}₫</span>
                                        {p.originalPrice > p.price && (
                                            <span className="text-xs text-muted-foreground line-through">
                                                {formatPrice(p.originalPrice)}₫
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetailSidebar;
