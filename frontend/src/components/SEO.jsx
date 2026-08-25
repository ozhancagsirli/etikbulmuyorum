import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, url, image }) {
  const fullTitle = title ? `${title} — EtikBulmuyorum` : 'EtikBulmuyorum — Güvenilir mi, değil mi? Toplum karar versin.';
  const fullDesc = description || 'Güvenilmez kişi ve firmaları ifşa et, başkalarını koru.';
  const fullUrl = url ? `https://etikbulmuyorum.com${url}` : 'https://etikbulmuyorum.com';
  const fullImage = image || 'https://etikbulmuyorum.com/og-image.png';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={fullDesc} />
      <link rel="canonical" href={fullUrl} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDesc} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:type" content="website" />

      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDesc} />
      <meta name="twitter:image" content={fullImage} />

      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "EtikBulmuyorum",
        "url": "https://etikbulmuyorum.com",
        "description": fullDesc,
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://etikbulmuyorum.com/?search={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      })}</script>
    </Helmet>
  );
}
