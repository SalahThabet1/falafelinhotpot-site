/**
 * Dedicated parser for Thursday Lesson (edu) newsletters.
 * Preserves full card structure: character, pinyin, tone, labels, descriptions, all examples.
 */
import fs from 'node:fs';
import path from 'node:path';
import { decodeEntities, formatInline, getCoverImage } from './parse-newsletter-html.mjs';

const FOOTER_CUT =
  /字 of the Week|A question for you|class="es-footer ac-footer"|Sent to:\s*%EMAIL%/i;

const SKIP_IMG =
  /social-icons|messenger-icons|youtube-circle|instagram-circle|tiktok-circle|whatsapp-rounded|stripo\.cluster|\[IMAGE_URL\]|logo_fav|wide_logo|width="96"/i;

const INTRO_MARKERS = [
  /Every character started as a drawing/i,
  /It is not a mistake/i,
  /In English, you feel blue/i,
  /Chinese has a whole vocabulary/i,
  /Chinese is full of four-character expressions/i,
  /Four tiny words/i,
  /We are learning/i,
  /Chinese people say/i,
  /Chinese people rarely say/i,
  /In Chinese, no is never/i,
  /So instead, Chinese people say something else/i,
  /Let me show you six/i,
];

function stripTags(html) {
  return decodeEntities(html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
}

function extractBalancedTable(html, markerIdx) {
  const tableStart = html.lastIndexOf('<table', markerIdx);
  if (tableStart < 0) return null;

  let depth = 0;
  const tagRe = /<\/?table\b[^>]*>/gi;
  tagRe.lastIndex = tableStart;
  let endIdx = tableStart;
  let match;

  while ((match = tagRe.exec(html)) !== null) {
    if (match[0].startsWith('</')) depth--;
    else depth++;
    if (depth === 0) {
      endIdx = tagRe.lastIndex;
      break;
    }
  }

  return html.slice(tableStart, endIdx);
}

function sliceEduBody(html) {
  let slice = html;
  const footerIdx = slice.search(FOOTER_CUT);
  if (footerIdx > 0) slice = slice.slice(0, footerIdx);

  for (const re of INTRO_MARKERS) {
    const idx = slice.search(re);
    if (idx > 0) {
      const before = slice.slice(0, idx);
      const pStart = before.lastIndexOf('<p');
      slice = slice.slice(pStart > 0 ? pStart : idx);
      break;
    }
  }

  return slice;
}

function isContentImage(tag) {
  const src = tag.match(/src="([^"]+)"/i)?.[1] || '';
  const width = Number(tag.match(/width="(\d+)"/i)?.[1] ?? 0);
  if (!src || SKIP_IMG.test(src) || src.includes('[IMAGE_URL]')) return false;
  if (width > 0 && width < 200) return false;
  return width >= 200;
}

function isBoilerplateCard(html) {
  return /WhatsApp channel|Join the channel →|Chinese language and culture tips, China and Arab/i.test(
    html
  );
}

function parseExamples(html) {
  const examples = [];

  // Standard example box (animal, fih, color)
  const stdRe =
    /Noto Serif SC'[^>]*font-size:(?:17|18)px[^>]*>([^<]+)<\/span>[\s\S]*?font-style:italic;font-size:(?:13|14\.5)px[^>]*>([^<]+)<\/span>[\s\S]*?font-size:(?:12\.5|14\.5)px[^>]*>([^<]+)<\/span>/gi;

  for (const m of html.matchAll(stdRe)) {
    const py = stripTags(m[2]);
    const en = stripTags(m[3]);
    examples.push({ zh: stripTags(m[1]), py, en });
  }

  if (examples.length) return examples;

  // Pickup-line / verdict examples (zh + combined pinyin · English)
  const verdictRe =
    /font-size:17px[^>]*>([^<]+)<\/span>[\s\S]*?font-size:13px[^>]*>([^<]+)<\/span>/gi;

  for (const m of html.matchAll(verdictRe)) {
    const line2 = stripTags(m[2]);
    if (/^Verdict:/i.test(line2)) continue;
    const dotIdx = line2.indexOf(' · ');
    examples.push({
      zh: stripTags(m[1]),
      py: dotIdx > 0 ? line2.slice(0, dotIdx).trim() : line2,
      en: dotIdx > 0 ? line2.slice(dotIdx + 3).trim() : '',
    });
  }

  if (examples.length) return examples;

  // Phrase cards (#8): gloss line + combined py/en on one line
  const phraseRe =
    /What it really means:[^<]*<\/td>[\s\S]*?font-size:18px[^>]*>([^<]+)<\/span>[\s\S]*?font-size:14\.5px[^>]*>([^<]+)<\/span>/gi;

  for (const m of html.matchAll(phraseRe)) {
    const combined = stripTags(m[2]);
    const dotIdx = combined.indexOf(' · ');
    examples.push({
      zh: stripTags(m[1]),
      py: dotIdx > 0 ? combined.slice(0, dotIdx).trim() : combined,
      en: dotIdx > 0 ? combined.slice(dotIdx + 3).trim() : '',
    });
  }

  return examples;
}

function parseCharMeta(html) {
  const character =
    html.match(/class="fih-glyph"[^>]*>([^<]+)</)?.[1] ||
    html.match(/Noto Serif SC'[^>]*font-size:(?:26|29|42|48|70|78)px[^>]*>([^<]+)</)?.[1];

  const pinyin =
    html.match(/class="fih-pinyin"[^>]*>([^<]+)</)?.[1] ||
    html.match(
      /Cormorant Garamond'[^>]*font-style:italic;font-size:(?:17|18|22|24|26|34)px[^>]*>([^<]+)</
    )?.[1];

  const toneMatch =
    html.match(/(?:NEUTRAL TONE|TONE \d|Tone \d)/i)?.[0] ||
    html.match(
      /font-size:11px;font-weight:600;letter-spacing:0\.2em;text-transform:uppercase[^>]*>((?:ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|\d)[^<]*)</i
    )?.[1];

  const meaning =
    html.match(
      /Cormorant Garamond'[^>]*font-size:24px[^>]*>([^<]+)<\/span>\s*<\/td>\s*<\/tr>\s*<\/table>\s*<\/td>\s*<\/tr>\s*<!-- Divider -->/
    )?.[1] ||
    html.match(/font-size:24px;font-weight:300;color:#1C1410[^>]*>([^<]+)</)?.[1] ||
    html.match(/font-size:13px;font-weight:500;color:#5A5550[^>]*>([^<]+)</)?.[1];

  return {
    character: character ? stripTags(character) : undefined,
    pinyin: pinyin ? stripTags(pinyin) : undefined,
    tone: toneMatch ? stripTags(toneMatch) : undefined,
    meaning: meaning ? stripTags(meaning) : undefined,
  };
}

function parseLabelDesc(html) {
  const label =
    html.match(
      /font-size:7px;font-weight:700;letter-spacing:0\.16em;text-transform:uppercase[^>]*>([^<]+)</
    )?.[1] ||
    html.match(
      /font-size:11px;font-weight:600;letter-spacing:0\.2em;text-transform:uppercase[^>]*>([^<]+)</
    )?.[1] ||
    html.match(
      /font-size:10px;font-weight:800;letter-spacing:0\.18em;text-transform:uppercase[^>]*>([^<]+)</
    )?.[1] ||
    html.match(/letter-spacing:0\.16em;text-transform:uppercase[^>]*>([^<]+)</)?.[1];

  const desc =
    html.match(/Cormorant Garamond'[^>]*line-height:1\.6[^>]*>([\s\S]*?)<\/p>/i)?.[1] ||
    html.match(/Cormorant Garamond'[^>]*line-height:1\.62[^>]*>([\s\S]*?)<\/p>/i)?.[1] ||
    html.match(/font-style:italic">([\s\S]*?)<\/p>/i)?.[1];

  return {
    label:
      label && !/^(ANCIENT|MODERN|象形)$/i.test(stripTags(label)) ? stripTags(label) : undefined,
    description: desc ? formatInline(stripTags(desc)) : '',
  };
}

function headingFromLabel(label) {
  if (!label || /^VIBE\b/i.test(label)) return '';
  const first = label.split(/\s*[—–-]\s*/)[0]?.trim();
  if (!first) return '';
  return first
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function parseLessonCardHtml(html, kind) {
  const { character, pinyin, tone, meaning } = parseCharMeta(html);
  const { label, description } = parseLabelDesc(html);
  const examples = parseExamples(html);
  const badge =
    html.includes('PICTOGRAPH') || html.includes('象形字') ? '象形字 — Pictograph' : undefined;

  let imageSrc;
  let imageAlt;
  const img =
    html.match(/<!-- HERO IMAGE -->[\s\S]*?<img[^>]+>/i)?.[0] ||
    html.match(/<img[^>]+width="520"[^>]+>/i)?.[0] ||
    html.match(/<img[^>]+>/i)?.[0];

  if (img && isContentImage(img)) {
    imageSrc = img.match(/src="([^"]+)"/i)?.[1];
    imageAlt = img.match(/alt="([^"]*)"/i)?.[1] ?? '';
  }

  const heading =
    kind === 'pictograph' && character && pinyin && meaning
      ? `${character} — ${pinyin} — ${meaning}`
      : headingFromLabel(label);

  return {
    character,
    pinyin,
    tone,
    meaning,
    label,
    description,
    examples,
    badge,
    imageSrc,
    imageAlt,
    heading,
    kind,
  };
}

function parseCompareSection(html) {
  const title = html.match(/THE SAME WORD[^<]*/i)?.[0]?.trim();
  const rows = [];

  const rowRe =
    /font-size:22px[^>]*>([^<]+)<\/span>[\s\S]*?font-size:12px[^>]*>([^<]+)<\/span>[\s\S]*?font-size:15px[^>]*font-style:italic[^>]*>([^<]+)<\/span>/gi;

  for (const m of html.matchAll(rowRe)) {
    const combined = stripTags(m[2]);
    const parts = combined.split(' — ');
    rows.push({
      zh: stripTags(m[1]),
      py: parts[0]?.trim() || combined,
      en: parts.slice(1).join(' — ').trim() || '',
      note: stripTags(m[3]),
    });
  }

  return { title, rows };
}

function cardRegions(html) {
  const regions = [];
  const seenStarts = new Set();

  function add(index, cardHtml, kind) {
    if (seenStarts.has(index) || isBoilerplateCard(cardHtml)) return;
    seenStarts.add(index);
    regions.push({ index, html: cardHtml, kind });
  }

  // Pictograph cards (#1)
  for (const m of html.matchAll(
    /<!-- Top accent bar -->[\s\S]*?<!-- Bottom accent bar -->[\s\S]*?height:2px;background:linear-gradient/gi
  )) {
    if (m[0].includes('ANCIENT')) add(m.index, m[0], 'pictograph');
  }

  // Fih cards (#2 particles, #3 colors)
  for (const m of html.matchAll(/background:#FDFAF6;overflow:hidden;box-shadow:0 2px 20px/gi)) {
    const card = extractBalancedTable(html, m.index);
    if (card) add(m.index, card, 'fih');
  }

  // Animal / idiom / number cards (#4–#6): compact shadow
  for (const m of html.matchAll(/background:#FDF9F1;overflow:hidden;box-shadow:0 2px 24px/gi)) {
    const card = extractBalancedTable(html, m.index);
    if (card && /font-size:(?:26|29|42|48)px/.test(card)) add(m.index, card, 'animal');
  }

  // Phrase cards (#8): larger shadow + border
  for (const m of html.matchAll(/overflow:hidden;box-shadow:0 6px 28px/gi)) {
    const card = extractBalancedTable(html, m.index);
    if (card && /font-size:29px/.test(card)) add(m.index, card, 'phrase');
  }

  // Compare table (#2)
  for (const m of html.matchAll(
    /THE SAME WORD[\s\S]*?padding:12px 0 14px 0[\s\S]*?<\/table>\s*<\/td>\s*<\/tr>\s*<\/table>/gi
  )) {
    add(m.index, m[0], 'compare');
  }

  return regions.sort((a, b) => a.index - b.index);
}

function inCardRegion(idx, regions) {
  return regions.some((r) => idx >= r.index && idx < r.index + r.html.length);
}

function extractEduBlocks(html) {
  const slice = sliceEduBody(html);
  const regions = cardRegions(slice);
  const blocks = [];

  for (const m of slice.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)) {
    if (inCardRegion(m.index, regions)) continue;
    const raw = m[1].replace(/<strong>\s*<\/strong>/gi, '');
    const text = formatInline(stripTags(raw));
    if (!text) continue;

    if (/<em[^>]*>/.test(m[1])) {
      blocks.push({ type: 'pullquote', index: m.index, text });
    } else {
      blocks.push({ type: 'heading', index: m.index, text });
    }
  }

  for (const region of regions) {
    if (region.kind === 'compare') {
      blocks.push({ type: 'compare', index: region.index, ...parseCompareSection(region.html) });
      continue;
    }

    const card = parseLessonCardHtml(region.html, region.kind);
    if (!card.description && !card.character && !card.examples.length) continue;

    // Skip duplicate heading when h3 already covers this card (issue #1)
    blocks.push({ type: 'lesson_card', index: region.index, ...card });
  }

  for (const m of slice.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    if (inCardRegion(m.index, regions)) continue;
    const plain = stripTags(m[1]);
    if (!plain || plain.length < 3) continue;
    if (/WhatsApp|Join the channel|Sent to:|%SENDER|Chinese language and culture tips/i.test(plain))
      continue;
    if (/^你好 ·|^Falafel in Hotpot has a WhatsApp/i.test(plain)) continue;

    blocks.push({ type: 'paragraph', index: m.index, text: formatInline(plain) });
  }

  blocks.sort((a, b) => a.index - b.index);

  const seen = new Set();
  const deduped = blocks.filter((b) => {
    if (b.type === 'lesson_card') {
      const key = `card:${b.character}:${b.label}:${b.description?.slice(0, 40)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }
    if (b.type !== 'paragraph' && b.type !== 'heading') return true;
    const key = `${b.type}:${b.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Drop lesson_card heading when an h3 with same text exists nearby
  return deduped.filter((b, i, arr) => {
    if (b.type !== 'lesson_card' || !b.heading) return true;
    const dupH3 = arr.some(
      (other) =>
        other.type === 'heading' &&
        other.text.replace(/\s+/g, ' ').toLowerCase() ===
          b.heading.replace(/\s+/g, ' ').toLowerCase()
    );
    return !dupH3;
  });
}

function mdxProp(name, value) {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'object') return `${name}={${JSON.stringify(value)}}`;
  return `${name}={${JSON.stringify(value)}}`;
}

function resolveImagePath(publicDir, publicPath) {
  if (!publicDir) return publicPath;
  const rel = publicPath.replace(/^\//, '');
  if (fs.existsSync(path.join(publicDir, rel))) return publicPath;
  const png = publicPath.replace(/\.jpg$/, '.png');
  if (fs.existsSync(path.join(publicDir, png.replace(/^\//, '')))) return png;
  return publicPath;
}

export function getEduOrderedImages(html) {
  const cover = getCoverImage(html);
  const coverKey = cover?.src?.split('?')[0];
  const blocks = extractEduBlocks(html);
  const inline = [];

  for (const b of blocks) {
    if (b.imageSrc && b.imageSrc.split('?')[0] !== coverKey) {
      inline.push({ src: b.imageSrc, alt: b.imageAlt || '' });
    }
  }

  return { cover, inline, all: cover ? [cover, ...inline] : inline };
}

export function parseEduNewsletterHtml(html, options = {}) {
  const { slug = '', trackFolder = 'thursday-lesson', publicDir = '' } = options;
  const cover = getCoverImage(html);
  const coverKey = cover?.src?.split('?')[0];
  const blocks = extractEduBlocks(html);

  let figNum = 0;
  const imagePathFor = (src) => {
    figNum++;
    const ext = src.match(/\.jpe?g/i) ? '.jpg' : src.match(/\.png/i) ? '.png' : '.jpg';
    return `/images/newsletters/${trackFolder}/${slug}-fig-${figNum}${ext}`;
  };

  const mdxParts = [];
  const imports = new Set();
  const imageGaps = [];
  const usedImages = new Set();
  let lastHeading = '';

  for (const block of blocks) {
    switch (block.type) {
      case 'heading':
        lastHeading = block.text;
        mdxParts.push(`\n## ${block.text}\n`);
        break;
      case 'pullquote':
        mdxParts.push(`\n<div class="pullquote">${block.text}</div>\n`);
        break;
      case 'paragraph':
        mdxParts.push(`\n${block.text}\n`);
        break;
      case 'lesson_card': {
        const heading =
          block.kind === 'pictograph' && block.character && block.pinyin && block.meaning
            ? `${block.character} — ${block.pinyin} — ${block.meaning}`
            : block.heading || headingFromLabel(block.label) || lastHeading;

        if (heading) lastHeading = heading;

        imports.add("import LessonEntry from '~/components/editions/LessonEntry.astro';");
        const attrs = [
          mdxProp('heading', heading),
          mdxProp('description', block.description || block.meaning || ''),
        ];

        if (block.kind === 'pictograph') {
          attrs.push('hidePhrase');
        } else {
          if (block.character) attrs.push(mdxProp('character', block.character));
          if (block.pinyin) attrs.push(mdxProp('pinyin', block.pinyin));
          if (block.tone) attrs.push(mdxProp('tone', block.tone));
          if (block.meaning) attrs.push(mdxProp('meaning', block.meaning));
        }

        if (
          block.imageSrc &&
          block.imageSrc.split('?')[0] !== coverKey &&
          !usedImages.has(block.imageSrc)
        ) {
          usedImages.add(block.imageSrc);
          const publicPath = imagePathFor(block.imageSrc);
          const resolved = resolveImagePath(publicDir, publicPath);
          const exists =
            publicDir && fs.existsSync(path.join(publicDir, resolved.replace(/^\//, '')));
          if (exists) {
            attrs.push(mdxProp('image', resolved));
          } else {
            const alt = block.imageAlt || block.label || block.character || `Figure ${figNum}`;
            imageGaps.push({ slug, fig: figNum, alt, publicPath, sourceUrl: block.imageSrc });
            mdxParts.push(
              `\n{/* IMAGE-GAP: ${slug} | fig-${figNum} | "${alt}" | ${publicPath} */}\n`
            );
          }
        }

        if (block.label) attrs.push(mdxProp('label', block.label));
        if (block.badge) attrs.push(mdxProp('badge', block.badge));
        if (block.examples?.length) attrs.push(mdxProp('examples', block.examples));

        mdxParts.push(`\n<LessonEntry ${attrs.filter(Boolean).join(' ')} />\n`);
        break;
      }
      case 'compare': {
        imports.add("import LessonCompare from '~/components/editions/LessonCompare.astro';");
        const attrs = [mdxProp('rows', block.rows)];
        if (block.title) attrs.push(mdxProp('title', block.title));
        mdxParts.push(`\n<LessonCompare ${attrs.filter(Boolean).join(' ')} />\n`);
        break;
      }
      default:
        break;
    }
  }

  return {
    bodyMd: mdxParts.join('\n').trim(),
    imports: [...imports],
    coverSrc: cover?.src || null,
    imageGaps,
    figCount: figNum,
  };
}
