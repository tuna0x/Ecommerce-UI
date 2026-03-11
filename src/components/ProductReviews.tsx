import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  ThumbsUp,
  ImageIcon,
  Camera,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Progress } from "../components/ui/progress";
import {
  mockReviews,
  currentUserPurchasedProducts,
  currentUserId,
  currentUserName,
  type Review,
} from "../data/mockReviews";
import { toast } from "sonner";

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
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [sortBy, setSortBy] = useState<
    "newest" | "helpful" | "highest" | "lowest"
  >("newest");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showWriteReview, setShowWriteReview] = useState(false);

  // Review form state
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [newImages, setNewImages] = useState<string[]>([]);

  const hasPurchased = currentUserPurchasedProducts.includes(productId);
  const hasReviewed = reviews.some(
    (r) => r.productId === productId && r.userId === currentUserId,
  );

  const productReviews = useMemo(() => {
    let filtered = reviews.filter((r) => r.productId === productId);

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
      case "helpful":
        filtered.sort((a, b) => b.helpful - a.helpful);
        break;
      case "highest":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "lowest":
        filtered.sort((a, b) => a.rating - b.rating);
        break;
    }

    return filtered;
  }, [reviews, productId, sortBy, filterRating]);

  // Rating distribution
  const ratingDistribution = useMemo(() => {
    const allProductReviews = reviews.filter((r) => r.productId === productId);
    const dist = [0, 0, 0, 0, 0];
    allProductReviews.forEach((r) => {
      dist[r.rating - 1]++;
    });
    return dist;
  }, [reviews, productId]);

  const totalProductReviews = ratingDistribution.reduce((a, b) => a + b, 0);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (newImages.length + files.length > 5) {
      toast.error("Tối đa 5 ảnh");
      return;
    }
    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Kích thước ảnh tối đa 5MB");
        return;
      }
      setNewImages((prev) => [...prev, URL.createObjectURL(file)]);
    });
  };

  const handleSubmitReview = () => {
    if (newRating === 0) {
      toast.error("Vui lòng chọn số sao");
      return;
    }
    if (newComment.trim().length < 10) {
      toast.error("Nhận xét tối thiểu 10 ký tự");
      return;
    }

    const newReview: Review = {
      id: Date.now(),
      productId,
      userId: currentUserId,
      userName: currentUserName,
      rating: newRating,
      comment: newComment,
      images: newImages.length > 0 ? newImages : undefined,
      orderId: "ORD-MOCK",
      isVerifiedPurchase: true,
      createdAt: new Date().toISOString(),
      helpful: 0,
    };

    setReviews((prev) => [newReview, ...prev]);
    setNewRating(0);
    setNewComment("");
    setNewImages([]);
    setShowWriteReview(false);
    toast.success("Đánh giá của bạn đã được gửi!");
  };

  const handleHelpful = (reviewId: number) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r,
      ),
    );
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
      {/* Rating Summary */}
      <div className="flex flex-col md:flex-row gap-8 p-6 bg-secondary/30 rounded-2xl">
        {/* Average */}
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

        {/* Distribution */}
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

      {/* Write Review Button / Info */}
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

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sắp xếp:</span>
          <div className="flex gap-1">
            {[
              { key: "newest" as const, label: "Mới nhất" },
              { key: "helpful" as const, label: "Hữu ích" },
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

      {/* Filter indicator */}
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

      {/* Write Review Form */}
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

              {/* Star rating */}
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

              {/* Comment */}
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

              {/* Image upload */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Hình ảnh (tùy chọn)
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  {newImages.map((img, idx) => (
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
                        onClick={() =>
                          setNewImages((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {newImages.length < 5 && (
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

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSubmitReview}>Gửi đánh giá</Button>
                <Button
                  variant="outline"
                  onClick={() => setShowWriteReview(false)}
                >
                  Hủy
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      <div className="space-y-4">
        {productReviews.length === 0 ? (
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
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">
                      {review.userName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {review.userName}
                      </span>
                      {review.isVerifiedPurchase && (
                        <span className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" />
                          Đã mua hàng
                        </span>
                      )}
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

              {/* Comment */}
              <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                {review.comment}
              </p>

              {/* Images */}
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

              {/* Helpful */}
              <button
                onClick={() => handleHelpful(review.id)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Hữu ích ({review.helpful})
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
