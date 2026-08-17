/**
 * Parse newsletter HTML into ordered MDX body blocks.
 * Preserves document order: paragraphs, headings, pull quotes, language cards, images.
 */
import fs from 'node:fs';
import path from 'node:path';

const SHARED_BANNER = 'a64816f9-33a3-46b0-a061-1d587926635c';
const LOGO_ASSET = 'd24cade6-23a2-4204-b552-e8837ad95ade';
const SKIP_IMG =
  /social-icons|messenger-icons|youtube-circle|instagram-circle|tiktok-circle|whatsapp-rounded|stripo\.cluster|\[IMAGE_URL\]|logo_fav|wide_logo/i;

const FOOTER_CUT =
  /字 of the Week|A question for you|Coming in future issues|What's next in this newsletter|Use it this week|YOUR CHALLENGE|class="es-footer ac-footer"|Sent to:\s*%EMAIL%/i;

const SKIP_TEXT =
  /^(FALAFEL IN HOTPOT|Issue No\.|You're receiving this|Unsubscribe|Sent to:|%SENDER|Falafel in Hotpot on LinkedIn|Join the channel|www\.falafelinhotpot|Chinese language, Arab culture, and the bridge|From the editor|学 SERIES · ISSUE|你好 ·|Falafel in Hotpot has a WhatsApp)$/i;

export function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"');
}

function stripTags(html) {
  return decodeEntities(html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
}

function isContentImage(tag) {
  const src = tag.match(/src="([^"]+)"/i)?.[1] || '';
  const width = Number(tag.match(/width="(\d+)"/i)?.[1] ?? 0);
  const isAdapt = /adapt-img/.test(tag);
  if (!src || SKIP_IMG.test(src) || src.includes('[IMAGE_URL]')) return false;
  if (src.includes(SHARED_BANNER)) return false;
  if (src.includes(LOGO_ASSET) && width < 200) return false;
  if (!isAdapt && width > 0 && width < 200) return false;
  return isAdapt || width >= 300;
}

function imageScore(src) {
  if (!src || src.includes('[IMAGE_URL]')) return -1;
  if (/\.jpe?g/i.test(src) && src.includes('/content/')) return 4;
  if (/adapt-img/.test(src)) return 3;
  if (/\.jpe?g/i.test(src)) return 2;
  if (/\.png/i.test(src) && src.includes('cdn-cgi')) return 1;
  return 1;
}

export function formatInline(text) {
  let out = decodeEntities(text);
  if (!out.trim()) return '';

  out = out.replace(/\.([A-Z])/g, '. $1');

  out = out.replace(
    /([\u4e00-\u9fff]+)\s*—\s*([a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü\s]+?)\s*—\s*([^—.]+?)(?=[.—]|$)/g,
    '<span class="zh">$1</span> — <span class="py">$2</span> — $3'
  );

  out = out.replace(
    /([\u4e00-\u9fff\u3400-\u4dbf]+(?:[，。！？、]?[\u4e00-\u9fff\u3400-\u4dbf]+)*)/g,
    (m) => {
      if (m.includes('class=')) return m;
      return `<span class="zh">${m}</span>`;
    }
  );

  out = out.replace(
    /([\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]+(?:\s+[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]+)*)/g,
    (m) => {
      if (m.includes('class=')) return m;
      return `<span class="ar">${m}</span>`;
    }
  );

  out = out.replace(/<span class="zh"><span class="zh">/g, '<span class="zh">');
  out = out.replace(/<\/span><\/span>/g, '</span>');

  return out.trim();
}

function isPullQuoteText(text) {
  const t = text.trim();
  return (
    t.length > 15 &&
    t.length < 220 &&
    (/^Neither of us|^Everything above|^Eight thousand|^Different words|^He was the only|^They were enthusiastic|^Two civilisations|^It is the whole|^The table in the middle|^Not everything that is true|^Same word|^Where they are/i.test(
      t
    ) ||
      (t.endsWith('.') &&
        /^[A-Z]/.test(t) &&
        t.split(' ').length < 25 &&
        /apart|conclusion|silence|below|surface|deal\?/i.test(t)))
  );
}

function sliceBodyHtml(html, track) {
  let slice = html;
  const footerIdx = slice.search(FOOTER_CUT);
  if (footerIdx > 0) slice = slice.slice(0, footerIdx);

  if (track === 'cultural') {
    const editorIdx = slice.search(/From the editor/i);
    if (editorIdx > 0) {
      slice = slice.slice(editorIdx);
      slice = slice.replace(/^[\s\S]*?From the editor[\s\S]*?<\/tr>/i, '');
    }
  } else {
    const introMarkers = [
      /Chinese has a whole vocabulary/i,
      /Let me show you six of them/i,
      /Chinese characters come from life/i,
      /On the Chinese character/i,
      /Four tiny words/i,
    ];
    let startIdx = -1;
    for (const re of introMarkers) {
      const m = slice.search(re);
      if (m >= 0 && (startIdx < 0 || m < startIdx)) startIdx = m;
    }
    if (startIdx > 0) {
      const before = slice.slice(0, startIdx);
      const pStart = before.lastIndexOf('<p');
      const divStart = before.lastIndexOf('<div style="background:transparent');
      const idx = Math.max(pStart, divStart);
      slice = slice.slice(idx > 0 ? idx : startIdx);
    }
  }

  return slice;
}

export function getCoverImage(html) {
  const footerIdx = html.search(FOOTER_CUT);
  const slice = footerIdx > 0 ? html.slice(0, footerIdx) : html;

  for (const m of slice.matchAll(/<img[^>]+>/gi)) {
    const tag = m[0];
    if (!isContentImage(tag)) continue;
    const src = tag.match(/src="([^"]+)"/i)?.[1];
    const alt = tag.match(/alt="([^"]*)"/i)?.[1] ?? '';
    return { src, alt: decodeEntities(alt), index: m.index };
  }
  return null;
}

function getSkipRanges(html) {
  const ranges = [];
  for (const m of html.matchAll(/<tr><td style="padding:16px 22px[\s\S]*?<\/tr>/gi)) {
    ranges.push([m.index, m.index + m[0].length]);
  }
  for (const m of html.matchAll(/background:#E8DDD0[\s\S]*?<\/table>/gi)) {
    ranges.push([m.index, m.index + m[0].length]);
  }
  return ranges;
}

function inRange(idx, ranges) {
  return ranges.some(([s, e]) => idx >= s && idx < e);
}

function parseLanguageCard(html) {
  const langMatch = html.match(/>\s*In (Chinese|Arabic)\s*</i);
  if (!langMatch) return null;

  const lang = langMatch[1].toLowerCase() === 'chinese' ? 'chinese' : 'arabic';
  const phraseMatch = html.match(
    lang === 'chinese' ? /font-family:'Noto Sans SC'[^>]*>([^<]+)</ : /dir="rtl"[^>]*>([^<]+)</
  );
  const translitMatch = html.match(/font-style:italic[^>]*>([^<]+)</);

  let gloss = '';
  const glossP = html.match(/font-size:14px;margin:8px 0 0 0[^>]*>([^<]+)/);
  if (glossP) gloss = stripTags(glossP[1]);
  if (!gloss) {
    const couldMean = html.match(/Could mean[^<]*<[^>]*>([^<]+)/i);
    if (couldMean) gloss = stripTags(couldMean[1]);
  }

  const phrase = phraseMatch ? stripTags(phraseMatch[1]) : '';
  const transliteration = translitMatch ? stripTags(translitMatch[1]) : '';

  if (!phrase) return null;
  return { lang, phrase, transliteration, gloss };
}

function parseVocabCard(html) {
  const titleMatch = html.match(
    /letter-spacing:0\.16em;text-transform:uppercase[^>]*>([^<]+(?:<[^>]+>[^<]*)?)<\/span>/i
  );
  if (!titleMatch) return null;

  const title = stripTags(titleMatch[1]);
  if (!/—/.test(title) || title.length < 8) return null;

  const descMatch = html.match(
    /font-family:'Cormorant Garamond'[^>]*line-height:1\.6[^>]*>([\s\S]*?)<\/p>/i
  );
  const description = descMatch ? formatInline(stripTags(descMatch[1])) : '';

  const exZh = html.match(/font-family:'Noto Sans SC'[^>]*>([^<]+)</)?.[1];
  const exPy = html.match(/font-style:italic;font-size:13px[^>]*>([^<]+)</)?.[1];
  const exEn = html.match(/font-size:12px[^>]*opacity:0\.75[^>]*>([^<]+)</)?.[1];

  const pinyinMatch = title.match(/^([a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü /]+)/);
  const toneMatch = html.match(/TONE\s+(\d)/i);

  return {
    title,
    pinyin: pinyinMatch?.[1]?.trim(),
    tone: toneMatch ? `Tone ${toneMatch[1]}` : undefined,
    description,
    exampleZh: exZh ? stripTags(exZh) : undefined,
    examplePy: exPy ? stripTags(exPy) : undefined,
    exampleEn: exEn ? stripTags(exEn) : undefined,
  };
}

function dedupeImageBlocks(blocks) {
  const bestByAlt = new Map();
  for (const block of blocks) {
    if (block.type !== 'image') continue;
    const alt = block.alt || path.basename(block.src);
    const prev = bestByAlt.get(alt);
    if (!prev || imageScore(block.src) > imageScore(prev.src)) {
      bestByAlt.set(alt, block);
    }
  }
  const keepKeys = new Set([...bestByAlt.values()].map((b) => b.src.split('?')[0]));
  return blocks.filter((b) => b.type !== 'image' || keepKeys.has(b.src.split('?')[0]));
}

function extractBlocks(html, track) {
  const slice = sliceBodyHtml(html, track);
  const skipRanges = getSkipRanges(slice);
  const blocks = [];

  const add = (block) => blocks.push(block);

  for (const m of slice.matchAll(/<table[^>]*background:#E8DDD0[\s\S]*?<\/table>/gi)) {
    const card = parseLanguageCard(m[0]);
    if (card) add({ type: 'language', index: m.index, ...card });
  }

  for (const m of slice.matchAll(/<tr><td style="padding:16px 22px[\s\S]*?<\/tr>/gi)) {
    const card = parseVocabCard(m[0]);
    if (card) add({ type: 'vocab', index: m.index, ...card });
  }

  for (const m of slice.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)) {
    const raw = m[1].replace(/<strong>\s*<\/strong>/gi, '');
    const text = formatInline(stripTags(raw));
    if (text.length >= 4 && text.length < 120) add({ type: 'heading', index: m.index, text });
  }

  for (const m of slice.matchAll(
    /font-family:'Cormorant Garamond'[^>]*font-size:26px[^>]*>([\s\S]*?)<\/div>/gi
  )) {
    const inner = m[1];
    const emOnly = inner.match(/<em[^>]*>([\s\S]*?)<\/em>/i);
    if (emOnly && stripTags(inner.replace(/<em[^>]*>|<\/em>/gi, '')).length < 5) {
      add({ type: 'pullquote', index: m.index, text: formatInline(stripTags(emOnly[1])) });
      continue;
    }
    const text = formatInline(stripTags(inner));
    if (text.length >= 12 && text.length < 200 && !SKIP_TEXT.test(text)) {
      add({ type: 'paragraph', index: m.index, text });
    }
  }

  for (const m of slice.matchAll(
    /border-left:2px solid #8B1A1A[\s\S]{0,400}?font-size:18px[^>]*>([\s\S]*?)<\/div>/gi
  )) {
    const text = formatInline(stripTags(m[1]));
    if (text.length >= 12) add({ type: 'pullquote', index: m.index, text });
  }

  for (const m of slice.matchAll(/<img[^>]+>/gi)) {
    const tag = m[0];
    if (!isContentImage(tag)) continue;
    const src = tag.match(/src="([^"]+)"/i)?.[1];
    const alt = tag.match(/alt="([^"]*)"/i)?.[1] ?? '';
    add({ type: 'image', index: m.index, src, alt: decodeEntities(alt) });
  }

  for (const m of slice.matchAll(/<p[^>]*style[^>]*>([\s\S]*?)<\/p>/gi)) {
    const inner = m[1];
    const idx = m.index;
    if (inRange(idx, skipRanges)) continue;

    if (/In Chinese|In Arabic|What it means:|Could mean/i.test(inner) && inner.length < 200)
      continue;

    const plain = stripTags(inner);
    if (!plain || plain.length < 3) continue;
    if (SKIP_TEXT.test(plain)) continue;
    if (/^Hit reply|^Connect with us|^If you are an Arab enterprise/i.test(plain)) continue;
    if (/WhatsApp channel|Join the channel|falafelinhotpot\.com/i.test(plain)) continue;
    if (/^你好 ·|^Falafel in Hotpot has a WhatsApp/i.test(plain)) continue;
    if (/Chinese language and culture tips, China and Arab world stories/i.test(plain)) continue;
    if (/^Sent to:|^%SENDER/i.test(plain)) continue;
    if (/they never said|but the answer was always|^no\.$/i.test(plain)) continue;

    const strongOnly = inner.match(/^[\s\S]*<strong[^>]*>([\s\S]*?)<\/strong>[\s\S]*$/i);
    if (strongOnly && stripTags(inner.replace(/<strong[^>]*>|<\/strong>/gi, '')).length < 5) {
      add({ type: 'pullquote', index: idx, text: formatInline(stripTags(strongOnly[1])) });
      continue;
    }

    const emOnly = inner.match(/^[\s\S]*<em[^>]*>([\s\S]*?)<\/em>[\s\S]*$/i);
    if (emOnly && stripTags(inner.replace(/<em[^>]*>|<\/em>/gi, '')).length < 5) {
      add({ type: 'pullquote', index: idx, text: formatInline(stripTags(emOnly[1])) });
      continue;
    }

    if (isPullQuoteText(plain)) {
      add({ type: 'pullquote', index: idx, text: formatInline(plain) });
      continue;
    }

    add({ type: 'paragraph', index: idx, text: formatInline(plain) });
  }

  blocks.sort((a, b) => a.index - b.index);

  const deduped = dedupeImageBlocks(blocks);

  const seen = new Set();
  const vocabDescs = new Set(deduped.filter((b) => b.type === 'vocab').map((b) => b.description));

  return deduped.filter((b) => {
    if (b.type === 'paragraph' && vocabDescs.has(b.text)) return false;
    const key = `${b.type}:${b.text || b.src || b.phrase || b.title}`;
    if (b.type === 'paragraph' || b.type === 'heading' || b.type === 'pullquote') {
      if (seen.has(key)) return false;
      seen.add(key);
    }
    return true;
  });
}

export function getOrderedImages(html, track = 'cultural') {
  const cover = getCoverImage(html);
  const coverKey = cover?.src?.split('?')[0];
  const blocks = extractBlocks(html, track);
  const images = blocks.filter((b) => b.type === 'image' && b.src.split('?')[0] !== coverKey);
  return {
    cover,
    inline: images,
    all: cover ? [cover, ...images] : images,
  };
}

function mdxProp(name, value) {
  if (!value) return '';
  return `${name}={${JSON.stringify(value)}}`;
}

export function parseNewsletterHtml(html, options = {}) {
  const { slug = '', trackFolder = 'cultural', publicDir = '', track = 'cultural' } = options;
  const cover = getCoverImage(html);
  const coverKey = cover?.src?.split('?')[0];
  const blocks = extractBlocks(html, track).filter(
    (b) => b.type !== 'image' || b.src.split('?')[0] !== coverKey
  );
  const images = blocks.filter((b) => b.type === 'image');

  const coverSrc = cover?.src || null;
  let figNum = 0;
  const imagePathFor = (src) => {
    figNum++;
    const ext = src.match(/\.jpe?g/i) ? '.jpg' : src.match(/\.png/i) ? '.png' : '.jpg';
    return `/images/newsletters/${trackFolder}/${slug}-fig-${figNum}${ext}`;
  };

  const mdxParts = [];
  const imports = new Set();
  const imageGaps = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'heading':
        mdxParts.push(`\n## ${block.text}\n`);
        break;
      case 'pullquote':
        mdxParts.push(`\n<div class="pullquote">${block.text}</div>\n`);
        break;
      case 'paragraph':
        mdxParts.push(`\n${block.text}\n`);
        break;
      case 'language': {
        imports.add("import LanguageExample from '~/components/editions/LanguageExample.astro';");
        const attrs = [
          `lang="${block.lang}"`,
          mdxProp('phrase', block.phrase),
          mdxProp('transliteration', block.transliteration || undefined),
          mdxProp('gloss', block.gloss || 'What it means'),
        ].filter(Boolean);
        mdxParts.push(`\n<LanguageExample ${attrs.join(' ')} />\n`);
        break;
      }
      case 'vocab': {
        imports.add("import VocabularyCard from '~/components/editions/VocabularyCard.astro';");
        const section = block.title.split('—')[0].trim();
        const sectionTitle = section.charAt(0) + section.slice(1).toLowerCase();
        mdxParts.push(`\n## ${sectionTitle}\n`);
        const attrs = [mdxProp('title', block.title), mdxProp('description', block.description)];
        if (block.pinyin) attrs.push(mdxProp('pinyin', block.pinyin));
        if (block.tone) attrs.push(`tone="${block.tone}"`);
        if (block.exampleZh) attrs.push(mdxProp('exampleZh', block.exampleZh));
        if (block.examplePy) attrs.push(mdxProp('examplePy', block.examplePy));
        if (block.exampleEn) attrs.push(mdxProp('exampleEn', block.exampleEn));
        mdxParts.push(`\n<VocabularyCard ${attrs.filter(Boolean).join(' ')} />\n`);
        break;
      }
      case 'image': {
        const publicPath = imagePathFor(block.src);
        const alt = block.alt || `Figure ${figNum}`;
        imports.add("import EditionFigure from '~/components/editions/EditionFigure.astro';");

        let resolvedPath = publicPath;
        if (publicDir) {
          const rel = publicPath.replace(/^\//, '');
          if (!fs.existsSync(path.join(publicDir, rel))) {
            const pngPath = publicPath.replace(/\.jpg$/, '.png');
            if (fs.existsSync(path.join(publicDir, pngPath.replace(/^\//, '')))) {
              resolvedPath = pngPath;
            }
          }
        }

        const exists =
          publicDir && fs.existsSync(path.join(publicDir, resolvedPath.replace(/^\//, '')));

        if (exists) {
          mdxParts.push(
            `\n<EditionFigure src="${resolvedPath}" alt="${alt.replace(/"/g, '\\"')}" />\n`
          );
        } else {
          imageGaps.push({ slug, fig: figNum, alt, publicPath, sourceUrl: block.src });
          mdxParts.push(
            `\n{/* IMAGE-GAP: ${slug} | fig-${figNum} | "${alt.replace(/"/g, '\\"')}" | ${publicPath} */}\n`
          );
        }
        break;
      }
      default:
        break;
    }
  }

  return {
    bodyMd: mdxParts.join('\n').trim(),
    imports: [...imports],
    coverSrc,
    imageGaps,
    figCount: figNum,
    orderedImages: images,
  };
}
