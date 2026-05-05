import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  ThumbsUp,
  Camera,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Progress } from "../components/ui/progress";
import { toast } from "sonner";
import { reviewService } from "../service/reviewService";
import type { IReview } from "../service/reviewService";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

interface ProductReviewsProps {
  productId: number;
  productRating: number;
  reviewCount: number;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  productRating,
  reviewCount,
}) => {
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);

  const { isAuthenticated, user } = useAuth();

  const [sortBy, setSortBy] = useState<"newest" | "helpful" | "highest" | "lowest">("newest");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showWriteReview, setShowWriteReview] = useState(false);

  // Review form state
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  const fetchReviews = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await reviewService.getReviewsByProduct(productId, currentPage, pageSize);
      if (res && res.data) {
        setReviews(res.data.result || []);
        if (res.data.meta) {
          setTotalPages(res.data.meta.pages);
          setTotalReviews(res.data.meta.total);
        }
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  }, [productId, currentPage, pageSize]);

  React.useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // For checking purchase status, we could call an API
  // For simplicity in this demo, we'll assume logged in users might have purchased
  // The backend will reject if they haven't anyway.
  React.useEffect(() => {
    if (isAuthenticated) {
      // In a real app, call: const res = await reviewService.checkPurchase(productId);
      // For now, let's keep it optimistic or add the check if possible.
      setHasPurchased(true); 
    }
  }, [isAuthenticated, productId]);

  const hasReviewed = useMemo(() => {
    return reviews.some(r => r.userName === user?.name);
  }, [reviews, user]);

  const productReviews = useMemo(() => {
    let filtered = [...reviews];

    if (filterRating) {
      filtered = filtered.filter((r) => r.rating === filterRating);
    }

    switch (sortBy) {
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case "highest":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "lowest":
        filtered.sort((a, b) => a.rating - b.rating);
        break;
    }

    return filtered;
  }, [reviews, sortBy, filterRating]);

  // Rating distribution
  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      dist[r.rating - 1]++;
    });
    return dist;
  }, [reviews]);

  const totalProductReviews = ratingDistribution.reduce((a, b) => a + b, 0);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (selectedFiles.length + files.length > 5) {
      toast.error("Tối đa 5 ảnh");
      return;
    }
    const newFiles = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...newFiles]);
    
    newFiles.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Kích thước ảnh tối đa 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmitReview = async () => {
    if (newRating === 0) {
      toast.error("Vui lòng chọn số sao");
      return;
    }
    if (newComment.trim().length < 10) {
      toast.error("Nhận xét tối thiểu 10 ký tự");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await reviewService.createReview(productId, newRating, newComment, selectedFiles);
      if (res.data) {
        toast.success("Đánh giá của bạn đã được gửi!");
        setNewRating(0);
        setNewComment("");
        setSelectedFiles([]);
        setPreviewImages([]);
        setShowWriteReview(false);
        fetchReviews(); // Refresh list
      }
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || "Không thể gửi đánh giá. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHelpful = () => {
    // This would ideally be an API call
    toast.info("Tính năng đang phát triển");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-8 p-6 bg-secondary/30 rounded-2xl">
        <div className="flex flex-col items-center justify-center min-w-[140px]">
          <span className="text-5xl font-bold text-foreground">
            {productRating}
          </span>
          <div className="flex items-center gap-0.5 my-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${i <= Math.round(productRating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {reviewCount} đánh giá
          </span>
        </div>

        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingDistribution[star - 1];
            const pct =
              totalProductReviews > 0 ? (count / totalProductReviews) * 100 : 0;
            return (
              <button
                key={star}
                onClick={() =>
                  setFilterRating(filterRating === star ? null : star)
                }
                className={`flex items-center gap-3 w-full group transition-colors rounded px-2 py-0.5 ${
                  filterRating === star ? "bg-primary/10" : "hover:bg-secondary"
                }`}
              >
                <div className="flex items-center gap-1 w-12 text-sm">
                  <span>{star}</span>
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                </div>
                <Progress value={pct} className="flex-1 h-2" />
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {hasPurchased && !hasReviewed ? (
          <Button
            onClick={() => setShowWriteReview(!showWriteReview)}
            className="gap-2"
          >
            <Star className="w-4 h-4" />
            Viết đánh giá
          </Button>
        ) : !hasPurchased ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            Bạn cần mua sản phẩm này trước khi đánh giá
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 px-4 py-2 rounded-lg">
            <Check className="w-4 h-4" />
            Bạn đã đánh giá sản phẩm này
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sắp xếp:</span>
          <div className="flex gap-1">
            {[
              { key: "newest" as const, label: "Mới nhất" },
              { key: "highest" as const, label: "Cao nhất" },
              { key: "lowest" as const, label: "Thấp nhất" },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key)}
                className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                  sortBy === opt.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filterRating && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Đang lọc:</span>
          <button
            onClick={() => setFilterRating(null)}
            className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
          >
            {filterRating} <Star className="w-3 h-3 fill-current" />
            <X className="w-3 h-3 ml-1" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {showWriteReview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 border border-border rounded-2xl space-y-4 bg-background">
              <h3 className="font-semibold text-lg">Viết đánh giá của bạn</h3>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Đánh giá
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      onMouseEnter={() => setHoverRating(i)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setNewRating(i)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          i <= (hoverRating || newRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                  {newRating > 0 && (
                    <span className="ml-3 text-sm text-muted-foreground">
                      {
                        ["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Xuất sắc"][
                          newRating
                        ]
                      }
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Nhận xét
                </label>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                  rows={4}
                  className="resize-none"
                />
                <span className="text-xs text-muted-foreground mt-1 block">
                  {newComment.length}/500 ký tự
                </span>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Hình ảnh (tùy chọn)
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  {previewImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative w-20 h-20 rounded-lg overflow-hidden border border-border"
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => {
                          setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
                          setPreviewImages((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {previewImages.length < 5 && (
                    <label className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 transition-colors text-muted-foreground hover:text-foreground">
                      <Camera className="w-5 h-5" />
                      <span className="text-[10px]">Thêm ảnh</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleSubmitReview} disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang gửi...</> : "Gửi đánh giá"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowWriteReview(false)}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Đang tải đánh giá...</p>
          </div>
        ) : productReviews.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Star className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-medium">Chưa có đánh giá nào</p>
            <p className="text-sm mt-1">
              {filterRating
                ? "Không có đánh giá phù hợp với bộ lọc"
                : "Hãy là người đầu tiên đánh giá sản phẩm này"}
            </p>
          </div>
        ) : (
          productReviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-secondary/20 rounded-xl border border-border/50"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-border/50">
                    <AvatarImage src={review.userImage} alt={review.userName} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {review.userName ? review.userName.charAt(0).toUpperCase() : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {review.userName}
                        </span>
                        {/* Always show verified since backend only allows purchased users */}
                        <span className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" />
                          Đã mua hàng
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i <= review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                {review.comment}
              </p>

              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {review.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="w-20 h-20 rounded-lg overflow-hidden border border-border"
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => handleHelpful()}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Hữu ích (0)
              </button>
            </motion.div>
          ))
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-6 mt-6 border-t font-sans">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentPage((prev) => Math.max(prev - 1, 1));
                window.scrollTo({ top: 0, behavior: 'smooth' }); // Optional: scroll up
              }}
              disabled={currentPage === 1 || loading}
              className="rounded-xl font-bold border-gray-200 hover:border-pink-200 hover:text-pink-600"
            >
              Trang trước
            </Button>
            <div className="text-sm font-bold text-gray-500">
              Trang {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                window.scrollTo({ top: 0, behavior: 'smooth' }); // Optional: scroll up
              }}
              disabled={currentPage === totalPages || loading}
              className="rounded-xl font-bold border-gray-200 hover:border-pink-200 hover:text-pink-600"
            >
              Trang sau
            </Button>
          </div>
        )}
        
        {totalReviews > 0 && (
          <div className="text-center mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Tổng cộng: {totalReviews} đánh giá
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
