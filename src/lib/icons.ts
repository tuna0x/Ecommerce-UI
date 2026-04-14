import { 
    Palette, 
    Sparkles, 
    UserCircle, 
    Wind, 
    ShoppingBag, 
    Heart, 
    Zap, 
    LayoutGrid,
    Star,
    Scissors,
    Shield
} from 'lucide-react';

export const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('trang điểm')) return Palette;
    if (n.includes('da') || n.includes('skincare')) return Sparkles;
    if (n.includes('mặt') || n.includes('face')) return UserCircle;
    if (n.includes('tóc') || n.includes('hair')) return Wind;
    if (n.includes('phụ kiện') || n.includes('accessory')) return ShoppingBag;
    if (n.includes('nước hoa') || n.includes('perfume')) return Heart;
    if (n.includes('khuyến mãi') || n.includes('sale')) return Zap;
    if (n.includes('mới') || n.includes('new')) return Star;
    if (n.includes('nails') || n.includes('móng')) return Scissors;
    if (n.includes('vệ sinh') || n.includes('clean')) return Shield;
    return LayoutGrid;
};
