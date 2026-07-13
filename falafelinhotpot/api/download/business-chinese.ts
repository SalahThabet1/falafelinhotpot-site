import { issueSignedToken, presignUrl } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  BLOB_PRESIGN_TTL_SECONDS,
  getBusinessChineseBlobPathname,
} from '../../lib/business-chinese-download';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('BLOB_READ_WRITE_TOKEN is not configured');
    return res.status(503).json({ error: 'Download service is temporarily unavailable.' });
  }

  const pathname = getBusinessChineseBlobPathname();

  try {
    const signedToken = await issueSignedToken({
      pathname,
      operations: ['get', 'head'],
      validUntil: Date.now() + BLOB_PRESIGN_TTL_SECONDS * 1000,
    });

    const { url } = await presignUrl(pathname, BLOB_PRESIGN_TTL_SECONDS, {
      signedToken,
    });

    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(302, url);
  } catch (error) {
    console.error('Failed to create business Chinese PDF download URL', error);
    return res.status(503).json({ error: 'Download service is temporarily unavailable.' });
  }
}
