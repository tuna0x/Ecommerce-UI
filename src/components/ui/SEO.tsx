import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string | null;
  description?: string | null;
  keywords?: string | null;
  image?: string | null;
  url?: string | null;
  type?: "website" | "article" | "product";
  productData?: {
    name: string;
    description: string;
    images: string[];
    price: number;
    currency: string;
    sku: string;
    brand: string;
    availability: string;
    ratingValue?: number;
    reviewCount?: number;
    category?: string;
  };
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  type = "website",
  productData,
}) => {
  const siteTitle = "Bông Cosmetic - Mỹ phẩm chính hãng & Chăm sóc sắc đẹp";
  const defaultDescription = "Bông Cosmetic chuyên cung cấp các dòng mỹ phẩm chính hãng, chăm sóc da, makeup từ các thương hiệu hàng đầu thế giới. Giao hàng nhanh, cam kết chất lượng.";
  const defaultImage = "/og-image.jpg";
  const defaultKeywords = "mỹ phẩm, chăm sóc da, son môi, nước hoa, Bông Cosmetic, skincare, makeup";

  const displayTitle = title ? `${title} | Bông Cosmetic` : siteTitle;
  const [activeTitle, setActiveTitle] = useState(displayTitle);
  const intervalRef = useRef<any>(null);
  const isHiddenRef = useRef(false);

  const funnyMessages = [
    "Đừng bỏ rơi em mà... 🥺",
    "Quay lại chốt đơn thôi! 💄",
    "Giỏ hàng vẫn đợi bạn nè! ❤️",
    "Sale sắp hết rồi, quay lại đi! 🔥",
    "Ơ kìa, đừng đi mà... 🌸"
  ];

  useEffect(() => {
    if (!isHiddenRef.current) {
      setActiveTitle(displayTitle);
    }
  }, [displayTitle]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        isHiddenRef.current = true;
        const showNextMessage = () => {
          const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
          setActiveTitle(randomMessage);
        };
        
        showNextMessage();
        intervalRef.current = setInterval(showNextMessage, 1500);
      } else {
        isHiddenRef.current = false;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setActiveTitle(displayTitle);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [displayTitle]);

  const seo = {
    title: activeTitle,
    description: description || defaultDescription,
    image: image || defaultImage,
    url: url ? `https://bongcosmetic.id.vn${url}` : "https://bongcosmetic.id.vn",
    keywords: keywords ? `${keywords}, ${defaultKeywords}` : defaultKeywords,
  };

  // Structured Data (JSON-LD) for Products
  const jsonLd = type === "product" && productData ? {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": productData.name,
    "image": productData.images,
    "description": productData.description,
    "sku": productData.sku,
    "brand": {
      "@type": "Brand",
      "name": productData.brand
    },
    "category": productData.category,
    "offers": {
      "@type": "Offer",
      "url": seo.url,
      "priceCurrency": productData.currency,
      "price": productData.price,
      "availability": productData.availability === "InStock" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition"
    },
    ...(productData.ratingValue && productData.reviewCount ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": productData.ratingValue,
        "reviewCount": productData.reviewCount
      }
    } : {})
  } : null;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="keywords" content={seo.keywords} />
      <link rel="canonical" href={seo.url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title ? `${title} | Bông Cosmetic` : siteTitle} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />
      <meta property="og:url" content={seo.url} />
      <meta property="og:site_name" content="Bông Cosmetic" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title ? `${title} | Bông Cosmetic` : siteTitle} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />

      {/* Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
