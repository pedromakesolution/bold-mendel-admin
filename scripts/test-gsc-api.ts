import { google } from 'googleapis';
import path from 'path';

async function testGSC() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const searchconsole = google.searchconsole({
      version: 'v1',
      auth: auth,
    });

    const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL || 'sc-domain:freeladock.com.br';
    
    console.log('Testing access for site:', siteUrl);
    console.log('Using Service Account:', process.env.GOOGLE_CLIENT_EMAIL);

    const response = await searchconsole.searchanalytics.query({
      siteUrl: siteUrl,
      requestBody: {
        startDate: '2023-01-01',
        endDate: '2023-01-02',
        dimensions: ['date'],
      },
    });

    console.log('SUCCESS! Request returned 200 OK.');
    console.log('Response data:', response.data);
  } catch (error: any) {
    console.error('ERROR during GSC test request:');
    console.error(error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

testGSC();
