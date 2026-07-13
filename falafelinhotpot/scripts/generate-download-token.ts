#!/usr/bin/env node
import { createBusinessChineseDownloadToken } from '../lib/business-chinese-download';

const email = process.argv[2];

if (!email) {
  console.error('Usage: npm run generate:download-token -- user@example.com');
  process.exit(1);
}

if (!process.env.DOWNLOAD_JWT_SECRET) {
  console.error('Missing DOWNLOAD_JWT_SECRET. Add it to .env or export it in your shell.');
  process.exit(1);
}

const token = await createBusinessChineseDownloadToken(email);
const siteUrl = process.env.SITE_URL || 'https://falafelinhotpot.com';

console.log(
  JSON.stringify(
    {
      email,
      token,
      downloadUrl: `${siteUrl}/download/business-chinese?token=${encodeURIComponent(token)}`,
    },
    null,
    2
  )
);
