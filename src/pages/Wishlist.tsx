import React from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import PageTransition from '../components/PageTransition';

const Wishlist: React.FC = () => {
  const { wishlist, isLoading, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-secondary rounded-full mb-4"></div>
          <div className="h-4 w-48 bg-secondary rounded mb-2"></div>
          <div className="h-3 w-32 bg-secondary rounded"></div>
        </div>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6"
          >
            <Heart className="w-12 h-12 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-bold mb-2">Danh sách yêu thích trống</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            Hãy thêm những sản phẩm bạn yêu thích vào danh sách này để dễ dàng theo dõi và mua sắm sau.
          </p>
          <Button asChild size="lg" className="rounded-full px-8">
            <Link to="/category/all">
              Khám phá ngay <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Sản phẩm yêu thích</h1>
            <p className="text-muted-foreground">
              Bạn đang có {wishlist.length} sản phẩm trong danh sách yêu thích.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="hidden md:flex">
            <Link to="/category/all">Tiếp tục mua sắm</Link>
          </Button>
        </div>

        {/* Custom Wishlist Grid with "Move to Cart" button */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {wishlist.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group flex flex-col"
            >
                <div className="flex flex-col flex-1">
                  <Link to={`/product/${product.id}`} className="block flex-1">
                    <div className="aspect-square bg-white rounded-xl overflow-hidden mb-3 relative border border-border/50">
                       <img 
                        src={product.thumbnail || (Array.isArray(product.image) ? product.image[0] : product.image) || ''} 
                        alt={product.name}
                        className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-110"
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleWishlist(product.id, true);
                        }}
                        className="absolute top-2 right-2 p-2 bg-background/90 backdrop-blur-sm rounded-full text-rose-500 shadow-sm hover:bg-rose-500 hover:text-white transition-all duration-300 z-10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-1 px-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider h-4 overflow-hidden">
                        {typeof product.brand === 'string' ? product.brand : (product.brand?.name || 'Thương hiệu')}
                      </p>
                      <h3 className="font-medium text-sm line-clamp-2 h-10 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-primary font-bold">
                        {new Intl.NumberFormat('vi-VN').format(product.finalPrice || product.price || 0)}₫
                      </p>
                    </div>
                  </Link>

                  <div className="mt-4 px-1">
                    <Button 
                      className="w-full rounded-xl gap-2 font-semibold shadow-sm hover:shadow-md transition-all"
                      onClick={() => addToCart(product, null, null, 1)}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Thêm vào giỏ
                    </Button>
                  </div>
                </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
};

export default Wishlist;
