export const BUSINESS_CHINESE_BLOB_PATHNAME = 'business-chinese.pdf';
export const BLOB_PRESIGN_TTL_SECONDS = 10 * 60;

export function getBusinessChineseBlobPathname(): string {
  return process.env.BLOB_BUSINESS_CHINESE_PATHNAME || BUSINESS_CHINESE_BLOB_PATHNAME;
}
