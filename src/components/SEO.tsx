import React, { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  roleId?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords = [],
  ogImage = "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=600",
  roleId = "general"
}) => {
  useEffect(() => {
    // Update Document Title
    document.title = title;

    // Update Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", description);

    // Update Meta Keywords
    if (keywords.length > 0) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement("meta");
        metaKeywords.setAttribute("name", "keywords");
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute("content", keywords.join(", "));
    }

    // OpenGraph Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute("content", title);

    // OpenGraph Description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement("meta");
      ogDesc.setAttribute("property", "og:description");
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute("content", description);

    // OpenGraph Image
    let ogImg = document.querySelector('meta[property="og:image"]');
    if (!ogImg) {
      ogImg = document.createElement("meta");
      ogImg.setAttribute("property", "og:image");
      document.head.appendChild(ogImg);
    }
    ogImg.setAttribute("content", ogImage);

    // Dynamic JSON-LD Structured Data
    const oldScript = document.getElementById("structured-data-jsonld");
    if (oldScript) {
      oldScript.remove();
    }

    const script = document.createElement("script");
    script.id = "structured-data-jsonld";
    script.type = "application/ld+json";

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Pranil Belge",
      "url": window.location.origin,
      "sameAs": [
        "https://www.linkedin.com/in/pranil-belge-ml/",
        "https://github.com/pranil2410"
      ],
      "jobTitle": title,
      "description": description,
      "knowsAbout": keywords
    };

    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      // Clean up structured data on unmount
      const currentScript = document.getElementById("structured-data-jsonld");
      if (currentScript) {
        currentScript.remove();
      }
    };
  }, [title, description, keywords, ogImage, roleId]);

  return null;
};

export default SEO;
