import { issueSignedToken, presignUrl } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  BLOB_PRESIGN_TTL_SECONDS,
  getBusinessChineseBlobPathname,
  verifyBusinessChineseDownloadToken,
} from '../../lib/business-chinese-download.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Checked before the token so an unconfigured deploy fails loudly rather than
  // rejecting every legitimate link as unauthorized.
  if (!process.env.DOWNLOAD_JWT_SECRET || !process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('Download service is missing DOWNLOAD_JWT_SECRET or BLOB_READ_WRITE_TOKEN');
    return res.status(503).json({ error: 'Download service is temporarily unavailable.' });
  }

  const token = typeof req.query.token === 'string' ? req.query.token : undefined;
  if (!token) {
    return res.status(401).json({ error: 'A download token is required.' });
  }

  try {
    await verifyBusinessChineseDownloadToken(token);
  } catch {
    // Expired, forged, or issued for a different resource — all the same to the caller.
    return res.status(401).json({ error: 'This download link is invalid or has expired.' });
  }

  const pathname = getBusinessChineseBlobPathname();
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
