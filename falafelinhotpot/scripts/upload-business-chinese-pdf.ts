#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { put } from '@vercel/blob';
import {
  BUSINESS_CHINESE_BLOB_PATHNAME,
  getBusinessChineseBlobPathname,
} from '../lib/business-chinese-download';

const defaultPdfPath = resolve(
  process.env.HOME ?? '',
  'Downloads/Business-Chinese-Essential-Vocabulary-and-Phrases.pdf'
);
const pdfPath = process.argv[2] ? resolve(process.argv[2]) : defaultPdfPath;
const pathname = getBusinessChineseBlobPathname();

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('Missing BLOB_READ_WRITE_TOKEN. Add it to .env or export it in your shell.');
  process.exit(1);
}

const file = readFileSync(pdfPath);

const blob = await put(pathname, file, {
  access: 'private',
  contentType: 'application/pdf',
  addRandomSuffix: false,
});

console.log(
  JSON.stringify(
    {
      pathname: blob.pathname,
      defaultPathname: BUSINESS_CHINESE_BLOB_PATHNAME,
      url: blob.url,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    },
    null,
    2
  )
);
