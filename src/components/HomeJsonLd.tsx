import { SITE } from "@/lib/site";

/** WebSite + Organization JSON-LD for the homepage (brand + logo for Google). */
export default function HomeJsonLd() {
  const logoUrl = `${SITE.baseUrl}/myhealthinclinedlogo.png`;
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE.baseUrl}/#website`,
        name: SITE.name,
        alternateName: [SITE.nameHandle, "healthinclined.com"],
        url: SITE.baseUrl,
        description: SITE.description,
        publisher: { "@id": `${SITE.baseUrl}/#organization` },
        inLanguage: "en-US",
      },
      {
        "@type": "Organization",
        "@id": `${SITE.baseUrl}/#organization`,
        name: SITE.name,
        alternateName: SITE.nameHandle,
        url: SITE.baseUrl,
        logo: {
          "@type": "ImageObject",
          url: logoUrl,
        },
        sameAs: [
          SITE.socialLinks.youtube,
          SITE.socialLinks.instagram,
          SITE.socialLinks.tiktok,
          SITE.socialLinks.facebook,
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
