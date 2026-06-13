import React from "react";
import { Helmet } from "react-helmet-async";

interface BreadcrumbItem {
  name: string;
  url?: string;
}

interface SEOProps {
  title?: string | null;
  description?: string | null;
  keywords?: string | null;
  image?: string | null;
  url?: string | null;
  type?: "website" | "article" | "product";
  includeWebsiteSchema?: boolean;
  breadcrumbs?: BreadcrumbItem[];
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

const SITE_URL = "https://bongcosmetic.id.vn";
const SITE_NAME = "Bong Cosmetic";
const SITE_TITLE = "Bong Cosmetic - My pham chinh hang & Cham soc sac dep";
const DEFAULT_DESCRIPTION =
  "Bong Cosmetic chuyen cung cap cac dong my pham chinh hang, cham soc da, makeup tu cac thuong hieu hang dau the gioi. Giao hang nhanh, cam ket chat luong.";
const DEFAULT_IMAGE = `${SITE_URL}/logo.jpg`;
const DEFAULT_KEYWORDS =
  "my pham, cham soc da, son moi, nuoc hoa, Bong Cosmetic, skincare, makeup";

const toAbsoluteUrl = (value?: string | null) => {
  if (!value) return undefined;
  return value.startsWith("http") ? value : `${SITE_URL}${value}`;
};

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  type = "website",
  includeWebsiteSchema = false,
  breadcrumbs,
  productData,
}) => {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_TITLE;
  const pageDescription = description || DEFAULT_DESCRIPTION;
  const pageImage = toAbsoluteUrl(image) || DEFAULT_IMAGE;
  const pageUrl = toAbsoluteUrl(url) || SITE_URL;
  const pageKeywords = keywords ? `${keywords}, ${DEFAULT_KEYWORDS}` : DEFAULT_KEYWORDS;

  const schemas: object[] = [];

  if (includeWebsiteSchema) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    });
  }

  if (breadcrumbs && breadcrumbs.length > 1) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        ...(item.url ? { item: toAbsoluteUrl(item.url) } : {}),
      })),
    });
  }

  if (type === "product" && productData) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Product",
      name: productData.name,
      image: productData.images.map((item) => toAbsoluteUrl(item) || item),
      description: productData.description,
      sku: productData.sku,
      brand: {
        "@type": "Brand",
        name: productData.brand,
      },
      category: productData.category,
      offers: {
        "@type": "Offer",
        url: pageUrl,
        priceCurrency: productData.currency,
        price: productData.price,
        availability:
          productData.availability === "InStock"
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
      },
      ...(productData.ratingValue && productData.reviewCount
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: productData.ratingValue,
              reviewCount: productData.reviewCount,
            },
          }
        : {}),
    });
  }

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={pageKeywords} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={pageUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />

      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
