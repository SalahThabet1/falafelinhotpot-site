import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createBusinessChineseDownloadToken } from '../../lib/business-chinese-download';

function getWebhookSecret(req: VercelRequest): string | undefined {
  const headerSecret = req.headers['x-download-webhook-secret'];
  if (typeof headerSecret === 'string' && headerSecret) {
    return headerSecret;
  }

  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length);
  }

  return undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const configuredSecret = process.env.DOWNLOAD_WEBHOOK_SECRET;
  if (!configuredSecret) {
    console.error('DOWNLOAD_WEBHOOK_SECRET is not configured');
    return res.status(503).json({ error: 'Token service is temporarily unavailable.' });
  }

  if (getWebhookSecret(req) !== configuredSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const email =
    typeof req.body?.email === 'string'
      ? req.body.email
      : typeof req.body?.contact?.email === 'string'
        ? req.body.contact.email
        : undefined;

  if (!email) {
    return res.status(400).json({ error: 'Missing email in request body.' });
  }

  try {
    const token = await createBusinessChineseDownloadToken(email);
    const siteUrl = process.env.SITE_URL || 'https://falafelinhotpot.com';
    const downloadUrl = `${siteUrl}/download/business-chinese?token=${encodeURIComponent(token)}`;

    return res.status(200).json({
      email,
      token,
      downloadUrl,
    });
  } catch (error) {
    console.error('Failed to issue business Chinese download token', error);
    return res.status(500).json({ error: 'Failed to issue download token.' });
  }
}
