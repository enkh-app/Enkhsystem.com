import Head from 'expo-router/head';

const SITE_URL = 'https://enkhsystems.com';

type SeoHeadProps = {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
};

export function SeoHead({ title, description, path, noIndex = false, structuredData }: SeoHeadProps) {
  const canonical = `${SITE_URL}${path === '/' ? '' : path}`;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="ENKH" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:locale" content="mn_MN" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {structuredData ? (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      ) : null}
    </Head>
  );
}

export const enkhStructuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'ENKH',
    alternateName: 'Enkh AI',
    url: SITE_URL,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'ENKH',
    alternateName: 'Enkh AI',
    url: SITE_URL,
    inLanguage: 'mn',
    publisher: { '@id': `${SITE_URL}/#organization` },
  },
];
