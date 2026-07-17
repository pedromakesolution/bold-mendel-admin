import { NextResponse } from 'next/server';
import { requestIndexing } from '@/lib/google-search-console';

export async function POST(req: Request) {
  try {
    // 1. Authorization check
    // Here we can check for a CRON_SECRET or an internal authorization token 
    // to prevent unauthorized calls to the index API if it's called externally.
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await req.json();
    const { url, type } = body;

    if (!url) {
      return NextResponse.json({ error: 'Missing "url" in request body' }, { status: 400 });
    }

    const indexingType = type || 'URL_UPDATED';
    if (!['URL_UPDATED', 'URL_DELETED'].includes(indexingType)) {
      return NextResponse.json({ error: 'Invalid "type". Must be URL_UPDATED or URL_DELETED.' }, { status: 400 });
    }

    // 3. Trigger Google Indexing API
    console.log(`[Fast Indexing API] Requesting ${indexingType} for: ${url}`);
    const result = await requestIndexing(url, indexingType as 'URL_UPDATED' | 'URL_DELETED');

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('[Fast Indexing API] Internal Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 });
  }
}
