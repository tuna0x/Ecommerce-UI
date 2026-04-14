import React, { useState, useEffect, useCallback } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../ui/select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { SearchableSelect } from "../SearchableSelect";
import { ProductService } from "../../service/productService";
import { categoryService } from "../../service/categoryService";
import { Loader2, ExternalLink, Package, LayoutGrid, FileText, Globe } from "lucide-react";
import { cn } from "../../lib/utils";

interface BannerLinkPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

type LinkType = "product" | "category" | "page" | "custom";

const APP_PAGES = [
  { label: "Trang chủ", value: "/" },
  { label: "Flash Sale", value: "/flash-sale" },
  { label: "Tất cả danh mục", value: "/categories" },
  { label: "Blog / Tin tức", value: "/blog" },
  { label: "Câu hỏi thường gặp (FAQ)", value: "/faq" },
  { label: "Về chúng tôi", value: "/about" },
  { label: "Liên hệ", value: "/contact" },
  { label: "Ví Voucher", value: "/voucher-wallet" },
];

export const BannerLinkPicker: React.FC<BannerLinkPickerProps> = ({
  value,
  onChange,
  className
}) => {
  const [type, setType] = useState<LinkType>("custom");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const [products, setProducts] = useState<{ id: number, name: string, thumbnail?: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number, name: string, slug: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Parse existing link to set initial state
  useEffect(() => {
    if (!value) {
      setType("custom");
      return;
    }

    if (value.startsWith("/product/")) {
      setType("product");
      setSelectedId(value.replace("/product/", ""));
    } else if (value.startsWith("/category/")) {
      setType("category");
      setSelectedId(value.replace("/category/", ""));
    } else if (APP_PAGES.some(p => p.value === value)) {
      setType("page");
      setSelectedId(value);
    } else {
      setType("custom");
    }
  }, [value]);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      if (type === "product" && products.length === 0) {
        const res = await ProductService.getAll(0, 50, undefined, "name,asc");
        if (res.data?.result) setProducts(res.data.result);
      } else if (type === "category" && categories.length === 0) {
        const res = await categoryService.getAll(0, 100, undefined, "name,asc");
        if (res.data?.result) setCategories(res.data.result);
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu cho Link Picker:", error);
    } finally {
      setIsLoading(false);
    }
  }, [type, products.length, categories.length]);

  useEffect(() => {
    if (type === "product" || type === "category") {
      fetchItems();
    }
  }, [type, fetchItems]);

  const handleTypeChange = (newType: LinkType) => {
    setType(newType);
    setSelectedId(null);
    if (newType === "custom") {
      onChange("");
    }
  };

  const handleItemSelect = (id: string) => {
    setSelectedId(id);
    if (type === "product") {
      onChange(`/product/${id}`);
    } else if (type === "category") {
      onChange(`/category/${id}`);
    } else if (type === "page") {
      onChange(id);
    }
  };

  const productOptions = products.map(p => ({
    value: p.id.toString(),
    label: p.name
  }));

  const categoryOptions = categories.map(c => ({
    value: c.slug,
    label: c.name
  }));


  return (
    <div className={cn("space-y-3 p-3 bg-muted/30 rounded-lg border border-border/50", className)}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Loại liên kết</Label>
          <Select value={type} onValueChange={(v) => handleTypeChange(v as LinkType)}>
            <SelectTrigger className="h-9 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="product">
                <div className="flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 text-blue-500" />
                  <span>Sản phẩm</span>
                </div>
              </SelectItem>
              <SelectItem value="category">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Danh mục</span>
                </div>
              </SelectItem>
              <SelectItem value="page">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-amber-500" />
                  <span>Trang nội bộ</span>
                </div>
              </SelectItem>
              <SelectItem value="custom">
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-rose-500" />
                  <span>Tự định nghĩa</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 text-right flex flex-col items-end justify-end">
           {value && (
             <div className="flex items-center gap-1.5 text-[10px] bg-primary/10 text-primary py-1 px-2 rounded-full border border-primary/20 animate-in fade-in slide-in-from-top-1">
               <ExternalLink className="h-3 w-3" />
               <span className="font-medium truncate max-w-[120px]">{value}</span>
             </div>
           )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">
          {type === "product" ? "Chọn sản phẩm" : 
           type === "category" ? "Chọn danh mục" : 
           type === "page" ? "Chọn trang" : "Địa chỉ liên kết"}
        </Label>
        
        {isLoading ? (
          <div className="h-9 w-full flex items-center justify-center bg-background rounded-md border border-input">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="ml-2 text-xs text-muted-foreground">Đang tải...</span>
          </div>
        ) : (
          <>
            {type === "product" && (
              <SearchableSelect 
                options={productOptions} 
                value={selectedId} 
                onValueChange={handleItemSelect}
                placeholder="Tìm sản phẩm..."
                searchPlaceholder="Gõ tên sản phẩm để tìm..."
              />
            )}
            {type === "category" && (
              <SearchableSelect 
                options={categoryOptions} 
                value={selectedId} 
                onValueChange={handleItemSelect}
                placeholder="Chọn một danh mục..."
              />
            )}
            {type === "page" && (
              <Select value={selectedId || ""} onValueChange={handleItemSelect}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="Chọn trang trang nội bộ..." />
                </SelectTrigger>
                <SelectContent>
                  {APP_PAGES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {type === "custom" && (
              <div className="relative">
                 <Input 
                   value={value} 
                   onChange={(e) => onChange(e.target.value)} 
                   placeholder="/product/1 hoặc https://..." 
                   className="h-9 bg-background pr-8"
                 />
                 <ExternalLink className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Visual Indicator for special types */}
      {(type === "product" || type === "category") && selectedId && (
        <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1 italic">
           <div className="h-1 w-1 rounded-full bg-primary" />
           Đường dẫn tự động: <strong>{value}</strong>
        </div>
      )}
    </div>
  );
};
