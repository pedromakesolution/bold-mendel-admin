import { google } from 'googleapis';

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

const getAuthClient = () => {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Google Search Console credentials are not configured in environment variables.');
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
};

/** Retorna métricas agregadas do site inteiro para um período */
export const getSiteMetrics = async (
  startDate?: string,
  endDate?: string
): Promise<SearchConsoleMetrics | null> => {
  try {
    const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL;
    if (!siteUrl) throw new Error('SEARCH_CONSOLE_SITE_URL is not configured.');

    const auth = getAuthClient();
    const searchconsole = google.webmasters({ version: 'v3', auth });

    const today = new Date();
    const defaultEndDate = today.toISOString().split('T')[0];
    const defaultStartDate = new Date(today.setDate(today.getDate() - 28)).toISOString().split('T')[0];

    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDate || defaultStartDate,
        endDate: endDate || defaultEndDate,
        dimensions: ['date'],
        aggregationType: 'auto',
      },
    });

    const rows = response.data.rows || [];

    if (rows.length === 0) return { clicks: 0, impressions: 0, ctr: 0, position: 0 };

    let totalClicks = 0;
    let totalImpressions = 0;
    let sumPosition = 0;

    rows.forEach((row) => {
      totalClicks += row.clicks || 0;
      totalImpressions += row.impressions || 0;
      sumPosition += (row.position || 0) * (row.impressions || 0);
    });

    const averagePosition = totalImpressions > 0 ? sumPosition / totalImpressions : 0;
    const averageCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;

    return { clicks: totalClicks, impressions: totalImpressions, ctr: averageCtr, position: averagePosition };
  } catch (error) {
    console.error('Error fetching site metrics:', error);
    return null;
  }
};

/** Retorna métricas para um post específico por slug */
export const getPostMetrics = async (
  slug: string,
  startDate?: string,
  endDate?: string
): Promise<SearchConsoleMetrics | null> => {
  try {
    const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL;
    const publicUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://freeladock.com.br';

    if (!siteUrl) throw new Error('SEARCH_CONSOLE_SITE_URL is not configured.');

    const auth = getAuthClient();
    const searchconsole = google.webmasters({ version: 'v3', auth });

    const today = new Date();
    const defaultEndDate = today.toISOString().split('T')[0];
    const defaultStartDate = new Date(today.setDate(today.getDate() - 28)).toISOString().split('T')[0];

    const postUrl = `${publicUrl}/blog/${slug}`;

    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDate || defaultStartDate,
        endDate: endDate || defaultEndDate,
        dimensions: ['page'],
        dimensionFilterGroups: [
          {
            filters: [
              { dimension: 'page', expression: postUrl, operator: 'equals' },
            ],
          },
        ],
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

/**
 * Busca métricas de TODAS as páginas de blog de uma só vez.
 * Retorna um Map de slug → metrics para uso eficiente na listagem.
 */
export const getAllPostsMetrics = async (
  startDate?: string,
  endDate?: string
): Promise<Map<string, SearchConsoleMetrics>> => {
  const result = new Map<string, SearchConsoleMetrics>();

  try {
    const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL;
    const publicUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://freeladock.com.br';

    if (!siteUrl) throw new Error('SEARCH_CONSOLE_SITE_URL is not configured.');

    const auth = getAuthClient();
    const searchconsole = google.webmasters({ version: 'v3', auth });

    const today = new Date();
    const defaultEndDate = today.toISOString().split('T')[0];
    const defaultStartDate = new Date(today.setDate(today.getDate() - 28)).toISOString().split('T')[0];

    const blogPrefix = `${publicUrl}/blog/`;

    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDate || defaultStartDate,
        endDate: endDate || defaultEndDate,
        dimensions: ['page'],
        dimensionFilterGroups: [
          {
            filters: [
              { dimension: 'page', expression: blogPrefix, operator: 'contains' },
            ],
          },
        ],
        aggregationType: 'auto',
        rowLimit: 500,
      },
    });

    const rows = response.data.rows || [];

    for (const row of rows) {
      const pageUrl = row.keys?.[0] || '';
      if (!pageUrl.includes('/blog/')) continue;

      // Extrai o slug da URL: https://freeladock.com.br/blog/MEU-SLUG
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

/**
 * Top queries do site inteiro (últimos N dias).
 * Usado na página SEO Analytics.
 */
export const getTopQueries = async (
  startDate?: string,
  endDate?: string,
  limit = 20
): Promise<TopQuery[]> => {
  try {
    const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL;
    if (!siteUrl) throw new Error('SEARCH_CONSOLE_SITE_URL is not configured.');

    const auth = getAuthClient();
    const searchconsole = google.webmasters({ version: 'v3', auth });

    const today = new Date();
    const defaultEndDate = today.toISOString().split('T')[0];
    const defaultStartDate = new Date(today.setDate(today.getDate() - 28)).toISOString().split('T')[0];

    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDate || defaultStartDate,
        endDate: endDate || defaultEndDate,
        dimensions: ['query'],
        aggregationType: 'auto',
        rowLimit: limit,
      },
    });

    const rows = response.data.rows || [];

    return rows.map((row) => ({
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

/**
 * Retorna série temporal diária do site para gráfico (últimos N dias).
 */
export const getDailyMetrics = async (
  startDate?: string,
  endDate?: string
): Promise<DailyMetric[]> => {
  try {
    const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL;
    if (!siteUrl) throw new Error('SEARCH_CONSOLE_SITE_URL is not configured.');

    const auth = getAuthClient();
    const searchconsole = google.webmasters({ version: 'v3', auth });

    const today = new Date();
    const defaultEndDate = today.toISOString().split('T')[0];
    const defaultStartDate = new Date(today.setDate(today.getDate() - 28)).toISOString().split('T')[0];

    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDate || defaultStartDate,
        endDate: endDate || defaultEndDate,
        dimensions: ['date'],
        aggregationType: 'auto',
        rowLimit: 90,
      },
    });

    const rows = response.data.rows || [];

    return rows.map((row) => ({
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
