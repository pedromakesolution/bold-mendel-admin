import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...value] = line.split('=');
    if (key && value.length > 0) {
      envVars[key.trim()] = value.join('=').trim().replace(/(^'|'$|^"|"$)/g, '');
    }
  }
}

async function testGSC() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: envVars.GOOGLE_CLIENT_EMAIL,
        private_key: envVars.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const searchconsole = google.searchconsole({
      version: 'v1',
      auth: auth,
    });

    const siteUrl = envVars.SEARCH_CONSOLE_SITE_URL || 'sc-domain:freeladock.com.br';
    
    console.log('Testing access for site:', siteUrl);
    console.log('Using Service Account:', envVars.GOOGLE_CLIENT_EMAIL);

    const response = await searchconsole.searchanalytics.query({
      siteUrl: siteUrl,
      requestBody: {
        startDate: '2023-01-01',
        endDate: '2023-01-02',
        dimensions: ['date'],
      },
    });

    console.log('SUCCESS! Request returned 200 OK.');
    // console.log('Response data:', response.data);
  } catch (error) {
    console.error('ERROR during GSC test request:');
    console.error(error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

testGSC();
