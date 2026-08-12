import { issueSignedToken, presignUrl } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const BLOB_PRESIGN_TTL_SECONDS = 10 * 60;
const DEFAULT_BLOB_PATHNAME = 'business-chinese.pdf';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('BLOB_READ_WRITE_TOKEN is not configured');
    return res.status(503).json({ error: 'Download service is temporarily unavailable.' });
  }

  const pathname = process.env.BLOB_BUSINESS_CHINESE_PATHNAME || DEFAULT_BLOB_PATHNAME;
  const validUntil = Date.now() + BLOB_PRESIGN_TTL_SECONDS * 1000;

  try {
    const signedToken = await issueSignedToken({
      pathname,
      operations: ['get'],
      validUntil,
    });

    const { presignedUrl } = await presignUrl(signedToken, {
      access: 'private',
      operation: 'get',
      pathname,
      validUntil,
    });

    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(302, presignedUrl);
  } catch (error) {
    console.error('Failed to create business Chinese PDF download URL', error);
    return res.status(503).json({ error: 'Download service is temporarily unavailable.' });
  }
}
