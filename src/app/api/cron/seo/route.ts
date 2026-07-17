import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

// Requires BLOG_SUPABASE_URL and BLOG_SUPABASE_SERVICE_ROLE_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_BLOG_SUPABASE_URL!;
const supabaseServiceKey = process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: Request) {
  try {
    // 1. Verify cron authorization
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Setup GSC Auth
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL;

    if (!clientEmail || !privateKey || !siteUrl) {
      return NextResponse.json({ error: 'Missing GSC configuration' }, { status: 500 });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const sc = google.webmasters({ version: 'v3', auth });

    // 3. Define the date range (3 days ago to ensure data is available and consolidated)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 3);
    const dateStr = targetDate.toISOString().split('T')[0];

    // 4. Fetch data from GSC
    console.log(`[Cron SEO] Fetching GSC data for ${dateStr}...`);
    const response = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: dateStr,
        endDate: dateStr,
        dimensions: ['date', 'query', 'page'],
        rowLimit: 5000, // adjust as needed
      },
    });

    const rows = response.data.rows || [];
    if (rows.length === 0) {
      console.log('[Cron SEO] No data returned from GSC for this date.');
      return NextResponse.json({ success: true, inserted: 0, message: 'No data found for this date.' });
    }

    // 5. Prepare data for Supabase
    const payload = rows.map((row) => {
      const date = row.keys?.[0] || dateStr;
      const query = row.keys?.[1] || '';
      const page = row.keys?.[2] || '';

      return {
        date,
        query,
        page,
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      };
    }).filter(row => row.query && row.page); // Ignore rows missing query/page if any

    if (payload.length === 0) {
      return NextResponse.json({ success: true, inserted: 0 });
    }

    // 6. Upsert into Supabase gsc_metrics table
    // Assumes UNIQUE(date, query, page) constraint exists on the table
    const { error } = await supabase
      .from('gsc_metrics')
      .upsert(payload, { onConflict: 'date, query, page' });

    if (error) {
      console.error('[Cron SEO] Error upserting into Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[Cron SEO] Successfully upserted ${payload.length} rows.`);
    return NextResponse.json({ success: true, inserted: payload.length });
  } catch (error: any) {
    console.error('[Cron SEO] Internal Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 });
  }
}
