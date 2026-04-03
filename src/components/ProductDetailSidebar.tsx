import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Shield, RotateCcw, Loader2 } from 'lucide-react';
import type { IProduct } from '../types/product.type';
import type { IBrand } from '../types/brand.type';
import { BrandService } from '../service/brandService';
import { ProductService } from '../service/productService';

interface ProductDetailSidebarProps {
    product: IProduct;
}

const ProductDetailSidebar: React.FC<ProductDetailSidebarProps> = ({ product }) => {
    const [brand, setBrand] = useState<IBrand | null>(null);
    const [sameBrandProducts, setSameBrandProducts] = useState<IProduct[]>([]);
    const [loading, setLoading] = useState(true);

    const brandObj = typeof product.brand === 'object' ? product.brand : null;
    const brandId = brandObj ? (brandObj as { id: number }).id : null;

    useEffect(() => {
        const fetchData = async () => {
            if (!brandId) {
                setLoading(false);
                return;
            }
            try {
                const [brandRes, productsRes] = await Promise.all([
                    BrandService.getById(brandId),
                    ProductService.getAll(0, 4, undefined, "id,desc", `brand.id:'${brandId}'`)
                ]);

                if (brandRes.data) {
                    setBrand(brandRes.data);
                }
                
                if (productsRes.data) {
                    setSameBrandProducts(productsRes.data.result.filter(p => p.id !== product.id));
                }
            } catch (error) {
                console.error("Error fetching sidebar data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [brandId, product.id]);

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
            {loading ? (
                <div className="bg-card border border-border rounded-xl p-8 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            ) : brand && (
                <div className="bg-card border border-border rounded-xl p-5 flex flex-col items-center gap-3">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-secondary/30 border border-border">
                        <img
                            src={brand.image || '/brand-placeholder.png'}
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
                        {sameBrandProducts.map((p) => {
                            const price = p.finalPrice || p.price || 0;
                            const originalPrice = p.originalPrice || 0;
                            const discount = p.discount || (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);
                            const image = p.thumbnail || (Array.isArray(p.image) ? p.image[0] : (p.image ?? ''));

                            return (
                                <Link
                                    key={p.id}
                                    to={`/product/${p.id}`}
                                    className="flex gap-3 group"
                                >
                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary/30 shrink-0 relative">
                                        <img src={image} alt={p.name} className="w-full h-full object-cover" />
                                        {discount > 0 && (
                                            <span className="absolute top-0.5 left-0.5 bg-primary text-primary-foreground text-[10px] font-bold px-1 rounded">
                                                -{discount}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                                            {p.name}
                                        </p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className="text-sm font-bold text-primary">{formatPrice(price)}₫</span>
                                            {originalPrice > price && (
                                                <span className="text-xs text-muted-foreground line-through">
                                                    {formatPrice(originalPrice)}₫
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetailSidebar;
