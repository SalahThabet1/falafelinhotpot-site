import { issueSignedToken, presignUrl } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  BLOB_PRESIGN_TTL_SECONDS,
  getBusinessChineseBlobPathname,
} from '../../lib/business-chinese-download.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Checked before presigning so an unconfigured deploy fails loudly rather than
  // rejecting every legitimate link as unauthorized.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('Download service is missing BLOB_READ_WRITE_TOKEN');
    return res.status(503).json({ error: 'Download service is temporarily unavailable.' });
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
