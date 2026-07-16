import { google } from 'googleapis';

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────

export interface SearchConsoleMetrics {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface PostGscMetric {
  url: string;
  slug: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface TopQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface DailyMetric {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface DeviceMetric {
  device: string; // 'MOBILE' | 'DESKTOP' | 'TABLET'
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface CountryMetric {
  country: string; // ISO 3166-1 alpha-3
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface TopPageMetric {
  url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SiteDashboardData {
  current: SearchConsoleMetrics;
  previous: SearchConsoleMetrics;
  daily: DailyMetric[];
  topQueries: TopQuery[];
  strikingDistance: TopQuery[]; // pos 5–20 com impressões altas
  topPages: TopPageMetric[];
  devices: DeviceMetric[];
  countries: CountryMetric[];
}

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────

const getAuthClient = () => {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Google Search Console credentials are not configured in environment variables.');
  }

  return new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function defaultRange(days = 28) {
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];
  const start = new Date(today);
  start.setDate(start.getDate() - days);
  const startDate = start.toISOString().split('T')[0];
  return { startDate, endDate };
}

function aggregateRows(rows: Array<{ clicks?: number | null; impressions?: number | null; position?: number | null }>): SearchConsoleMetrics {
  let totalClicks = 0, totalImpressions = 0, sumPosition = 0;
  rows.forEach(r => {
    totalClicks += r.clicks || 0;
    totalImpressions += r.impressions || 0;
    sumPosition += (r.position || 0) * (r.impressions || 0);
  });
  return {
    clicks: totalClicks,
    impressions: totalImpressions,
    ctr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
    position: totalImpressions > 0 ? sumPosition / totalImpressions : 0,
  };
}

// ─────────────────────────────────────────────
// Funções de busca individuais
// ─────────────────────────────────────────────

/** Métricas agregadas do site para um período */
export const getSiteMetrics = async (
  startDate?: string,
  endDate?: string
): Promise<SearchConsoleMetrics | null> => {
  try {
    const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL;
    if (!siteUrl) throw new Error('SEARCH_CONSOLE_SITE_URL is not configured.');

    const { startDate: sd, endDate: ed } = defaultRange(28);
    const auth = getAuthClient();
    const sc = google.webmasters({ version: 'v3', auth });

    const response = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDate || sd,
        endDate: endDate || ed,
        dimensions: ['date'],
        aggregationType: 'auto',
      },
    });

    const rows = response.data.rows || [];
    if (rows.length === 0) return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    return aggregateRows(rows);
  } catch (error) {
    console.error('Error fetching site metrics:', error);
    return null;
  }
};

/** Métricas para um post específico por slug */
export const getPostMetrics = async (
  slug: string,
  startDate?: string,
  endDate?: string
): Promise<SearchConsoleMetrics | null> => {
  try {
    const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL;
    const publicUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://freeladock.com.br';
    if (!siteUrl) throw new Error('SEARCH_CONSOLE_SITE_URL is not configured.');

    const { startDate: sd, endDate: ed } = defaultRange(28);
    const auth = getAuthClient();
    const sc = google.webmasters({ version: 'v3', auth });
    const postUrl = `${publicUrl}/blog/${slug}`;

    const response = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDate || sd,
        endDate: endDate || ed,
        dimensions: ['page'],
        dimensionFilterGroups: [{ filters: [{ dimension: 'page', expression: postUrl, operator: 'equals' }] }],
        aggregationType: 'auto',
      },
    });

    const rows = response.data.rows || [];
    if (rows.length === 0) return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    const data = rows[0];
    return {
      clicks: data.clicks || 0,
      impressions: data.impressions || 0,
      ctr: data.ctr || 0,
      position: data.position || 0,
    };
  } catch (error) {
    console.error(`Error fetching metrics for post ${slug}:`, error);
    return null;
  }
};

/** Métricas de TODOS os posts de blog de uma vez. Retorna Map<slug, metrics>. */
export const getAllPostsMetrics = async (
  startDate?: string,
  endDate?: string
): Promise<Map<string, SearchConsoleMetrics>> => {
  const result = new Map<string, SearchConsoleMetrics>();
  try {
    const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL;
    const publicUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://freeladock.com.br';
    if (!siteUrl) throw new Error('SEARCH_CONSOLE_SITE_URL is not configured.');

    const { startDate: sd, endDate: ed } = defaultRange(28);
    const auth = getAuthClient();
    const sc = google.webmasters({ version: 'v3', auth });
    const blogPrefix = `${publicUrl}/blog/`;

    const response = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDate || sd,
        endDate: endDate || ed,
        dimensions: ['page'],
        dimensionFilterGroups: [{ filters: [{ dimension: 'page', expression: blogPrefix, operator: 'contains' }] }],
        aggregationType: 'auto',
        rowLimit: 500,
      },
    });

    for (const row of response.data.rows || []) {
      const pageUrl = row.keys?.[0] || '';
      if (!pageUrl.includes('/blog/')) continue;
      const slug = pageUrl.replace(blogPrefix, '').replace(/\/$/, '').split('/')[0];
      if (!slug) continue;
      result.set(slug, {
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      });
    }
  } catch (error) {
    console.error('Error fetching all posts metrics:', error);
  }
  return result;
};

/** Top queries do site inteiro */
export const getTopQueries = async (
  startDate?: string,
  endDate?: string,
  limit = 20
): Promise<TopQuery[]> => {
  try {
    const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL;
    if (!siteUrl) throw new Error('SEARCH_CONSOLE_SITE_URL is not configured.');

    const { startDate: sd, endDate: ed } = defaultRange(28);
    const auth = getAuthClient();
    const sc = google.webmasters({ version: 'v3', auth });

    const response = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDate || sd,
        endDate: endDate || ed,
        dimensions: ['query'],
        aggregationType: 'auto',
        rowLimit: limit,
      },
    });

    return (response.data.rows || []).map(row => ({
      query: row.keys?.[0] || '',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }));
  } catch (error) {
    console.error('Error fetching top queries:', error);
    return [];
  }
};

/** Série temporal diária */
export const getDailyMetrics = async (
  startDate?: string,
  endDate?: string
): Promise<DailyMetric[]> => {
  try {
    const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL;
    if (!siteUrl) throw new Error('SEARCH_CONSOLE_SITE_URL is not configured.');

    const { startDate: sd, endDate: ed } = defaultRange(28);
    const auth = getAuthClient();
    const sc = google.webmasters({ version: 'v3', auth });

    const response = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDate || sd,
        endDate: endDate || ed,
        dimensions: ['date'],
        aggregationType: 'auto',
        rowLimit: 90,
      },
    });

    return (response.data.rows || []).map(row => ({
      date: row.keys?.[0] || '',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }));
  } catch (error) {
    console.error('Error fetching daily metrics:', error);
    return [];
  }
};

// ─────────────────────────────────────────────
// Site Dashboard — carrega tudo em paralelo
// ─────────────────────────────────────────────

/**
 * Busca todos os dados necessários para o Site Dashboard.
 * 8 requisições paralelas + período anterior para calcular delta (▲/▼).
 */
export const getSiteDashboard = async (days = 28): Promise<SiteDashboardData | null> => {
  try {
    const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL;
    if (!siteUrl) throw new Error('SEARCH_CONSOLE_SITE_URL is not configured.');

    const auth = getAuthClient();
    const sc = google.webmasters({ version: 'v3', auth });

    // Período atual
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    const startCur = new Date(today);
    startCur.setDate(startCur.getDate() - days);
    const startDateCur = startCur.toISOString().split('T')[0];

    // Período anterior (mesmo tamanho, imediatamente antes)
    const endPrev = new Date(startCur);
    endPrev.setDate(endPrev.getDate() - 1);
    const startPrev = new Date(endPrev);
    startPrev.setDate(startPrev.getDate() - days);
    const startDatePrev = startPrev.toISOString().split('T')[0];
    const endDatePrev = endPrev.toISOString().split('T')[0];

    const q = (dims: string[], sd: string, ed: string, limit = 25) =>
      sc.searchanalytics.query({
        siteUrl,
        requestBody: { startDate: sd, endDate: ed, dimensions: dims as any, aggregationType: 'auto', rowLimit: limit },
      });

    // 8 requisições simultâneas
    const [curR, prevR, dailyR, queriesR, strikingR, pagesR, deviceR, countryR] = await Promise.all([
      q(['date'], startDateCur, endDate, 90),
      q(['date'], startDatePrev, endDatePrev, 90),
      q(['date'], startDateCur, endDate, 90),
      q(['query'], startDateCur, endDate, 25),
      q(['query'], startDateCur, endDate, 200),
      q(['page'], startDateCur, endDate, 20),
      q(['device'], startDateCur, endDate, 10),
      q(['country'], startDateCur, endDate, 10),
    ]);

    const current = aggregateRows(curR.data.rows || []);
    const previous = aggregateRows(prevR.data.rows || []);

    const daily: DailyMetric[] = (dailyR.data.rows || []).map(r => ({
      date: r.keys?.[0] || '',
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr || 0,
      position: r.position || 0,
    }));

    const topQueries: TopQuery[] = (queriesR.data.rows || []).map(r => ({
      query: r.keys?.[0] || '',
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr || 0,
      position: r.position || 0,
    }));

    const strikingDistance: TopQuery[] = (strikingR.data.rows || [])
      .map(r => ({
        query: r.keys?.[0] || '',
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: r.ctr || 0,
        position: r.position || 0,
      }))
      .filter(r => r.position >= 5 && r.position <= 20 && r.impressions >= 5)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 15);

    const topPages: TopPageMetric[] = (pagesR.data.rows || []).map(r => ({
      url: r.keys?.[0] || '',
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr || 0,
      position: r.position || 0,
    }));

    const devices: DeviceMetric[] = (deviceR.data.rows || []).map(r => ({
      device: r.keys?.[0] || 'UNKNOWN',
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr || 0,
      position: r.position || 0,
    }));

    const countries: CountryMetric[] = (countryR.data.rows || []).map(r => ({
      country: r.keys?.[0] || 'unknown',
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr || 0,
      position: r.position || 0,
    }));

    return { current, previous, daily, topQueries, strikingDistance, topPages, devices, countries };
  } catch (error) {
    console.error('Error fetching site dashboard:', error);
    return null;
  }
};
