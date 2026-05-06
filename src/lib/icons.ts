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
    Shield,
    Shirt,
    Leaf,
    Bath,
    Flower2,
    Smile,
    Pill,
    Baby,
    HeartPulse,
    Wand2
} from 'lucide-react';

export const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    
    // Most specific first
    if (n.includes('trang điểm')) return Palette;
    if (n.includes('nước hoa')) return Heart;
    if (n.includes('thời trang') || n.includes('quần áo')) return Shirt;
    if (n.includes('thực phẩm chức năng') || n.includes('dinh dưỡng')) return Leaf;
    if (n.includes('tóc') || n.includes('da đầu')) return Scissors;
    if (n.includes('da mặt') || n.includes('skincare')) return Wand2;
    if (n.includes('cơ thể') || n.includes('body')) return Bath;
    if (n.includes('cá nhân')) return Smile;
    if (n.includes('mẹ và bé') || n.includes('trẻ em')) return Baby;
    if (n.includes('sức khỏe')) return HeartPulse;
    if (n.includes('phụ kiện')) return ShoppingBag;
    if (n.includes('nước hoa')) return Flower2;
    
    // General patterns
    if (n.includes('da')) return Sparkles;
    if (n.includes('mặt')) return UserCircle;
    if (n.includes('khuyến mãi') || n.includes('sale')) return Zap;
    if (n.includes('mới')) return Star;
    if (n.includes('vệ sinh')) return Shield;
    
    return LayoutGrid;
};
