import { timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createBusinessChineseDownloadToken } from '../../lib/business-chinese-download.js';

// Simple in-memory rate limit for the token-minting webhook. Serverless
// instances reset the map on cold start, so this is a per-instance throttle,
// not a global quota — still enough to blunt brute-force of the shared secret
// and spam minting without adding a dependency.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim();
  return req.socket.remoteAddress ?? 'unknown';
}

function secretsEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

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

  if (rateLimited(`ip:${clientIp(req)}`)) {
    return res.status(429).json({ error: 'Too many requests.' });
  }

  if (!configuredSecret || !secretsEqual(getWebhookSecret(req) ?? '', configuredSecret)) {
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

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  if (rateLimited(`email:${email.toLowerCase()}`)) {
    return res.status(429).json({ error: 'Too many requests.' });
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
