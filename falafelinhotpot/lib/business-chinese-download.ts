import { SignJWT, jwtVerify } from 'jose';

export const BUSINESS_CHINESE_RESOURCE = 'business-chinese';
export const BUSINESS_CHINESE_BLOB_PATHNAME = 'business-chinese.pdf';
export const DOWNLOAD_JWT_TTL_SECONDS = 24 * 60 * 60;
export const BLOB_PRESIGN_TTL_SECONDS = 10 * 60;

export type BusinessChineseDownloadClaims = {
  email: string;
  resource: typeof BUSINESS_CHINESE_RESOURCE;
};

function getJwtSecret(): Uint8Array {
  const secret = process.env.DOWNLOAD_JWT_SECRET;
  if (!secret) {
    throw new Error('DOWNLOAD_JWT_SECRET is not configured');
  }
  return new TextEncoder().encode(secret);
}

export function getBusinessChineseBlobPathname(): string {
  return process.env.BLOB_BUSINESS_CHINESE_PATHNAME || BUSINESS_CHINESE_BLOB_PATHNAME;
}

export async function createBusinessChineseDownloadToken(email: string): Promise<string> {
  return new SignJWT({
    email: email.trim().toLowerCase(),
    resource: BUSINESS_CHINESE_RESOURCE,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${DOWNLOAD_JWT_TTL_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifyBusinessChineseDownloadToken(
  token: string
): Promise<BusinessChineseDownloadClaims> {
  const { payload } = await jwtVerify(token, getJwtSecret(), {
    algorithms: ['HS256'],
  });

  if (payload.resource !== BUSINESS_CHINESE_RESOURCE) {
    throw new Error('Invalid download resource');
  }

  if (typeof payload.email !== 'string' || !payload.email) {
    throw new Error('Invalid download token payload');
  }

  return {
    email: payload.email,
    resource: BUSINESS_CHINESE_RESOURCE,
  };
}
