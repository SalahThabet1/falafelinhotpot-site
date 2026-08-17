#!/usr/bin/env node
/**
 * Import ActiveCampaign newsletter exports → src/content/editions/*.mdx
 *
 * Sources:
 *   ~/Downloads/ac_cultural_newsletters/
 *   ~/Downloads/ac_edu_newsletters/
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEduOrderedImages, parseEduNewsletterHtml } from './parse-edu-newsletter-html.mjs';
import { getOrderedImages, parseNewsletterHtml } from './parse-newsletter-html.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CULTURAL_SRC =
  process.env.CULTURAL_SRC || path.join(process.env.HOME, 'Downloads/ac_cultural_newsletters');
const EDU_SRC = process.env.EDU_SRC || path.join(process.env.HOME, 'Downloads/ac_edu_newsletters');
const OUT_DIR = path.join(ROOT, process.env.OUT_DIR || 'src/content/editions');
const PUBLIC_DIR = path.join(ROOT, 'public');
const SLUGS_PATH = path.join(__dirname, 'edition-slugs.json');
const MANIFEST_PATH = path.join(ROOT, 'MISSING_IMAGES.md');

const SLUGS = JSON.parse(fs.readFileSync(SLUGS_PATH, 'utf-8'));

const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf]/;
const ARABIC_RE = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/;

const CUTOFF_PATTERNS = [
  /^字 of the Week/i,
  /^Use it this week/i,
  /^Coming in future/i,
  /^What this newsletter/i,
  /^What's next/i,
  /^A question for you/i,
  /^YOUR CHALLENGE/i,
  /^The Arabic Bridge/i,
  /^🌉/,
  /^— Falafel/,
  /^Until next week/i,
  /^You're receiving this/i,
  /^Unsubscribe/i,
  /^Sent to:/i,
  /^%SENDER-INFO/i,
  /^Falafel in Hotpot on LinkedIn/i,
  /^Connect with us on LinkedIn/i,
  /^If you are an Arab enterprise/i,
  /^文化桥$/,
  /^https?:\/\//i,
  /^www\./i,
  /^···$/,
  /^→$/,
];

const MASTHEAD_PATTERNS = [
  /^\*\s*$/,
  /^Issue No\.\s*\d+$/i,
  /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i,
  /^FALAFEL IN HOTPOT$/i,
  /^学 SERIES · ISSUE \d+$/i,
  /^From the editor$/i,
  /^Chinese language, Arab culture/i,
  /^A newsletter about Chinese language/i,
  /^On [\u4e00-\u9fff]/i,
  /^On .+ — .+$/i,
  /^\*\s*[\u200c\u200b\s]*$/,
  /^ANCIENT象形$/i,
  /^MODERN字形$/i,
  /^象形字 — PICTOGRAPH$/i,
  /^VIBE\s+—/i,
  /^NEUTRAL TONE$/i,
  /^THE SAME WORD/i,
  /^YOUR CHALLENGE/i,
];

const BOILERPLATE_TAGLINE =
  'Chinese language, Arab culture, and the bridge most people never knew existed.';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&nbsp;/g, ' ');
}

function yamlString(s) {
  if (!s) return '""';
  return `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function yamlArray(arr) {
  if (!arr?.length) return '[]';
  return `[${arr.map((t) => yamlString(t)).join(', ')}]`;
}

function titleCase(s) {
  const cleaned = s.replace(/[.!?]+$/, '').trim();
  // Preserve subject-line casing for short titles
  if (cleaned.length < 60 && /[a-z]/.test(cleaned) && /[A-Z]/.test(cleaned)) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned
    .split(/\s+/)
    .map((w) => {
      const lower = w.toLowerCase();
      if (
        ['no', 'i', 'a', 'the', 'in', 'on', 'and', 'or', 'to', 'of', 'is', 'it'].includes(lower) &&
        w === lower
      )
        return lower;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ')
    .replace(/^No\b/i, 'No')
    .replace(/\bI\b/g, 'I')
    .replace(/\bChinese\b/g, 'Chinese')
    .replace(/\bArab\b/g, 'Arab');
}

function truncate(s, n = 160) {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim() + '…';
}

function extFromUrl(url) {
  const ext = path.extname(url.split('?')[0]).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext))
    return ext === '.jpeg' ? '.jpg' : ext;
  return '.jpg';
}

function fileExists(publicPath) {
  return fs.existsSync(path.join(PUBLIC_DIR, publicPath.replace(/^\//, '')));
}

// ---------------------------------------------------------------------------
// Canonical folder picker
// ---------------------------------------------------------------------------

function listIssueFolders(srcRoot, issuePattern) {
  const folders = [];
  if (!fs.existsSync(srcRoot)) return folders;

  for (const name of fs.readdirSync(srcRoot)) {
    const dir = path.join(srcRoot, name);
    if (!fs.statSync(dir).isDirectory()) continue;
    const m = name.match(issuePattern);
    if (!m) continue;

    const issue = Number(m[1]);
    const metaPath = path.join(dir, '_meta.json');
    const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf-8')) : {};
    const sdate = meta.sdate || '';
    const hasDate = /^\d{4}-\d{2}-\d{2}/.test(sdate);

    const subjFile = fs.readdirSync(dir).find((f) => f.endsWith('_subject.txt'));
    const txtFile = fs.readdirSync(dir).find((f) => f.endsWith('.txt') && !f.includes('subject'));
    const htmlFile = fs.readdirSync(dir).find((f) => f.endsWith('.html'));

    folders.push({
      issue,
      dir,
      name,
      sdate,
      hasDate,
      sendAmt: Number(meta.send_amt || 0),
      subject: subjFile ? fs.readFileSync(path.join(dir, subjFile), 'utf-8').trim() : '',
      txtPath: txtFile ? path.join(dir, txtFile) : null,
      htmlPath: htmlFile ? path.join(dir, htmlFile) : null,
    });
  }

  const byIssue = {};
  for (const f of folders) {
    const cur = byIssue[f.issue];
    const score = (x) => [x.hasDate ? 1 : 0, x.sendAmt, x.sdate || ''];
    if (!cur || score(f) > score(cur)) byIssue[f.issue] = f;
  }
  return byIssue;
}

// ---------------------------------------------------------------------------
// Text parsing
// ---------------------------------------------------------------------------

function extractTitleAr(lines, subjectLine) {
  for (const line of lines) {
    const t = line.trim();
    if (!t || t === subjectLine) continue;
    if (MASTHEAD_PATTERNS.some((p) => p.test(t))) continue;
    if (CUTOFF_PATTERNS.some((p) => p.test(t))) continue;
    if (ARABIC_RE.test(t) && !CJK_RE.test(t) && t.length > 5 && t.length < 120) return t;
  }
  return '';
}

function shouldSkipLine(line, ctx) {
  const t = line.trim();
  if (!t) return true;
  if (MASTHEAD_PATTERNS.some((p) => p.test(t))) return true;
  if (CUTOFF_PATTERNS.some((p) => p.test(t))) return true;
  if (t === BOILERPLATE_TAGLINE) return true;
  if (t === ctx.subjectLine) return true;
  if (t === ctx.titleAr) return true;
  if (/^The short answer is:$/i.test(t)) return true;
  if (/^The long answer is:$/i.test(t)) return true;
  if (/^I love eating falafel/i.test(t)) return true;
  // Headline fragments from masthead
  if (/^The story behind$/i.test(t)) return true;
  if (/^the$/i.test(t) && ctx.track === 'cultural') return true;
  if (/^name\.$/i.test(t)) return true;
  if (/^Nobody eats$/i.test(t)) return true;
  if (/^alone\.$/i.test(t)) return true;
  if (/^Nobody\.$/i.test(t)) return true;
  if (/^They never said no\.$/i.test(t)) return true;
  if (/^But the answer was always$/i.test(t)) return true;
  if (/^no\.$/i.test(t)) return true;
  if (/^\*\*no\.\*\*$/i.test(t)) return true;
  if (/^\*\*Nobody\.\*\*$/i.test(t)) return true;
  if (/^\*\s*[\u200c\u200b\s]*$/.test(t)) return true;
  if (/^Different words\. Same silence behind them\.$/i.test(t)) return false;
  if (/^Four tiny words\.$/i.test(t)) return true;
  if (/^Infinite personality\.$/i.test(t)) return true;
  if (/^Chinese characters$/i.test(t)) return true;
  if (/^come from life\.$/i.test(t)) return true;
  if (ctx.track === 'learn' && /^Chinese characters come from life\.$/i.test(t) && !ctx.bodyStarted)
    return true;
  if (/^and the pictures hidden inside Chinese writing\.?$/i.test(t)) return true;
  if (/^Let me show you six of them\.?$/i.test(t) && ctx.track === 'learn' && ctx.issueNumber === 1)
    return false;
  return false;
}

function isCutoff(line) {
  return CUTOFF_PATTERNS.some((p) => p.test(line.trim()));
}

function parseHeading(line) {
  const t = line.trim();
  // Section headings use **** markers in newsletter source
  const m4 = t.match(/^\*{4}(.+?)\*{4}$/);
  if (m4) return m4[1].trim();
  // Short standalone section titles without trailing period
  if (
    t.length >= 8 &&
    t.length < 80 &&
    !/[.!?]$/.test(t) &&
    !CJK_RE.test(t) &&
    !ARABIC_RE.test(t) &&
    /^[A-Z]/.test(t) &&
    !/^In Chinese|^In Arabic|^And |^But |^When |^So |^Here |^The first/i.test(t)
  ) {
    const knownSections = [
      'What this costs people who do not know',
      'The ease that nobody can explain',
      'Sharing space',
      'Sharing knowledge, sharing connections',
    ];
    if (knownSections.some((s) => t.startsWith(s.slice(0, 12)))) return t;
  }
  return null;
}

function parseEmphasis(line) {
  const t = line.trim();
  const m = t.match(/^\*\*(.+)\*\*\.?$/);
  if (!m || m[1].length >= 120) return null;
  const inner = m[1].trim();
  // Skip masthead headline fragments
  if (/^no\.?$/i.test(inner)) return null;
  if (/^Nobody\.?$/i.test(inner)) return null;
  if (/^name\.?$/i.test(inner)) return null;
  return inner;
}

function isPullQuote(line) {
  const t = line.trim();
  return (
    t.length > 20 &&
    t.length < 200 &&
    /^Not everything|^Two civilisations|^Eight thousand|^Everything above|^He was the only|^They were enthusiastic|^The table in the middle|^Same word/i.test(
      t
    )
  );
}

function formatInline(text) {
  if (text.includes('<span class=')) return text;

  let out = text;

  // Character — pinyin — meaning
  out = out.replace(
    /([\u4e00-\u9fff]+)\s*—\s*([a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü\s]+?)\s*—\s*([^—.]+?)(?=[.—]|$)/g,
    '<span class="zh">$1</span> — <span class="py">$2</span> — $3'
  );

  // Split by existing tags, wrap bare CJK/Arabic segments only
  out = out.replace(
    /([\u4e00-\u9fff\u3400-\u4dbf]+(?:[，。！？、]?[\u4e00-\u9fff\u3400-\u4dbf]+)*)/g,
    (m, _g, offset) => {
      const before = out.slice(Math.max(0, offset - 20), offset);
      if (before.includes('class="zh"') || before.includes('character="')) return m;
      return `<span class="zh">${m}</span>`;
    }
  );

  out = out.replace(
    /([\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]+(?:\s+[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]+)*)/g,
    (m, _g, offset) => {
      const before = out.slice(Math.max(0, offset - 20), offset);
      if (before.includes('class="ar"')) return m;
      return `<span class="ar">${m}</span>`;
    }
  );

  out = out.replace(/<span class="zh"><span class="zh">/g, '<span class="zh">');
  out = out.replace(/<span class="ar"><span class="ar">/g, '<span class="ar">');
  out = out.replace(/<\/span><\/span>/g, '</span>');

  return out;
}

function parseLanguageBlock(lines, startIdx) {
  const label = lines[startIdx].trim();
  // Language blocks are standalone labels, not "In Chinese, when someone says..."
  const isChinese = /^In Chinese\s*$/i.test(label);
  const isArabic = /^In Arabic\s*$/i.test(label);
  if (!isChinese && !isArabic) return null;

  const langClass = isChinese ? 'zh' : 'ar';
  const parts = [];
  let i = startIdx + 1;

  while (i < lines.length) {
    const t = lines[i].trim();
    if (!t) {
      i++;
      continue;
    }
    if (/^In Chinese\s*$|^In Arabic\s*$/i.test(t)) break;
    if (parseHeading(t)) break;
    if (isCutoff(t)) break;
    if (/^[A-Z][a-z].{40,}/.test(t) && parts.length >= 3) break;
    parts.push(t);
    i++;
    if (parts.length >= 4) break;
  }

  if (!parts.length) return { nextIdx: startIdx + 1, block: '' };

  const phrase = parts[0].replace(/[。?？!！]$/, '');
  const translit =
    parts.find((p) => /^[A-Za-z\u0100-\u017F]/.test(p) && (p.includes('—') || p.includes('-'))) ||
    '';
  const gloss =
    parts.find((p) => /^What it means|^Could mean|^Not a question/i.test(p)) ||
    parts.slice(2).find((p) => p.length > 15) ||
    '';

  let block = `\n<strong><span class="${langClass}">${phrase}</span></strong>\n`;
  if (translit) block += `— ${formatInline(translit)}\n\n`;
  if (gloss && gloss !== phrase) block += `${formatInline(gloss)}\n\n`;

  return { nextIdx: i, block };
}

function parseLearn01CharacterCards(text) {
  const cards = [];
  const charHeaderRe =
    /^\*{2,4}([\u4e00-\u9fff]) — ([a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+) — (.+?)\*{2,4}$/;

  const lines = text.split('\n').map((l) => l.trim());
  let intro = [];
  let i = 0;

  while (i < lines.length) {
    const hm = lines[i].match(charHeaderRe);
    if (!hm) {
      if (
        lines[i] &&
        !shouldSkipLine(lines[i], {
          track: 'learn',
          subjectLine: '',
          titleAr: '',
          bodyStarted: false,
        })
      )
        intro.push(lines[i]);
      i++;
      continue;
    }

    const [, character, pinyin, meaningRaw] = hm;
    const meaning = meaningRaw.trim();
    i++;

    const descLines = [];
    while (i < lines.length && !charHeaderRe.test(lines[i]) && !isCutoff(lines[i])) {
      const t = lines[i];
      if (
        !t ||
        t === character ||
        /^ANCIENT|^MODERN|^象形字|^Tone \d/i.test(t) ||
        /^[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔù]+Tone \d/i.test(t) ||
        t === meaning ||
        /^Horse$|^Sun|^Moon|^Mountain|^Water|^Tree|^Wood$/i.test(t) ||
        /^This is what I find most beautiful/i.test(t) ||
        /^They are not arbitrary/i.test(t) ||
        /^When you learn Chinese this way/i.test(t) ||
        /^And that is a very long/i.test(t)
      ) {
        i++;
        continue;
      }
      if (t.length > 20) descLines.push(t);
      i++;
    }

    const toneMatch = text.match(new RegExp(`${pinyin}[\\s\\S]{0,30}Tone (\\d)`, 'i'));
    const tone = toneMatch ? `Tone ${toneMatch[1]}` : '';

    cards.push({
      character,
      pinyin,
      tone,
      meaning,
      description: dedupeSentences(descLines.join(' ') || meaning),
    });
  }

  return { intro: intro.filter(Boolean), cards };
}

function dedupeSentences(text) {
  const parts = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const seen = new Set();
  return parts
    .filter((s) => {
      const key = s.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(' ');
}

function buildLearn01Body(text) {
  const { intro, cards } = parseLearn01CharacterCards(text);
  const introOnly = intro.filter((p) => p.length > 20 && !/^On /i.test(p));

  const closingLines = [];
  const cutoffIdx = text.search(/字 of the Week|— Falafel/i);
  const tail = cutoffIdx > 0 ? text.slice(0, cutoffIdx) : text;
  const closingMatch = tail.match(
    /This is what I find most beautiful about Chinese characters\.[\s\S]+?And that is a very long conversation\./
  );
  if (closingMatch)
    closingLines.push(
      ...closingMatch[0]
        .split(/\n\n+/)
        .map((l) => l.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
    );

  const natural = cards.filter((c) => ['日', '月', '山', '水', '木'].includes(c.character));
  const animals = cards.filter((c) => c.character === '马');

  let body = introOnly.map((p) => `${formatInline(p)}\n`).join('\n') + '\n';

  if (natural.length) {
    body += `## Characters from the natural world (<span class="zh">日</span>, <span class="zh">月</span>, <span class="zh">山</span>, <span class="zh">水</span>, <span class="zh">木</span>)\n\n`;
    body += `The characters for sun, moon, mountain, water, and tree each started as a simple sketch — a child's drawing of what they saw. Once you see the picture, you will never unsee it.\n\n`;
    for (const c of natural) {
      body += `<CharacterCard\n  character="${c.character}"\n  pinyin="${c.pinyin}"\n  tone="${c.tone || 'Tone 4'}"\n  meaning="${c.meaning.replace(/"/g, '\\"')}"\n  description="${c.description.replace(/"/g, '\\"')}"\n/>\n\n`;
    }
  }

  if (animals.length) {
    body += `## Animals too (<span class="zh">马</span>)\n\n`;
    for (const c of animals) {
      body += `<CharacterCard\n  character="${c.character}"\n  pinyin="${c.pinyin}"\n  tone="${c.tone || 'Tone 3'}"\n  meaning="${c.meaning.replace(/"/g, '\\"')}"\n  description="${c.description.replace(/"/g, '\\"')}"\n/>\n\n`;
    }
  }

  const closing = closingLines.filter((p) => p.length > 20);
  if (closing.length) body += '\n' + closing.map((p) => `${formatInline(p)}\n`).join('\n') + '\n';

  return body.trim();
}

function bodyToMdx(rawText, ctx) {
  if (ctx.track === 'learn' && ctx.issueNumber === 1) {
    return buildLearn01Body(rawText);
  }

  const lines = decodeEntities(rawText).split('\n');
  const blocks = [];
  let bodyStarted = false;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (isCutoff(line)) break;

    const ctxLine = { ...ctx, bodyStarted };
    if (shouldSkipLine(line, ctxLine)) {
      i++;
      continue;
    }

    const langBlock = parseLanguageBlock(lines, i);
    if (langBlock && /^In Chinese\s*$|^In Arabic\s*$/i.test(lines[i].trim())) {
      blocks.push(langBlock.block);
      i = langBlock.nextIdx;
      bodyStarted = true;
      continue;
    }

    const heading = parseHeading(line);
    if (heading) {
      blocks.push(`## ${formatInline(heading)}\n`);
      i++;
      bodyStarted = true;
      continue;
    }

    const emphasis = parseEmphasis(line);
    if (emphasis) {
      blocks.push(`**${formatInline(emphasis)}**\n`);
      i++;
      bodyStarted = true;
      continue;
    }

    // Collect paragraph (may span multiple lines until blank)
    const paraLines = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t) break;
      if (isCutoff(t)) break;
      if (parseHeading(t)) break;
      if (/^In Chinese\s*$|^In Arabic\s*$/i.test(t)) break;
      if (shouldSkipLine(t, { ...ctx, bodyStarted: true })) {
        i++;
        continue;
      }
      paraLines.push(t);
      i++;
    }

    if (!paraLines.length) {
      i++;
      continue;
    }

    const para = paraLines.join(' ').replace(/\s+/g, ' ').trim();
    if (para.length < 3) continue;

    if (isPullQuote(para)) {
      blocks.push(`<em>${formatInline(para)}</em>\n`);
    } else {
      blocks.push(`${formatInline(para)}\n`);
    }
    bodyStarted = true;

    while (i < lines.length && !lines[i].trim()) i++;
  }

  return blocks.join('\n').trim();
}

// ---------------------------------------------------------------------------
// Image gap insertion
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Image sync from local Downloads exports
// ---------------------------------------------------------------------------

function uuidFromUrl(url) {
  return url
    .match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)?.[1]
    ?.toLowerCase();
}

function basenameFromUrl(url) {
  return path.basename((url || '').split('?')[0]).toLowerCase();
}

function listContentImages(searchDirs) {
  const files = [];
  for (const imagesDir of searchDirs) {
    if (!fs.existsSync(imagesDir)) continue;
    for (const f of fs.readdirSync(imagesDir)) {
      if (/rounded-gray|linkedin|youtube|instagram|tiktok|whatsapp|47ca7986-dfea/i.test(f))
        continue;
      if (!/\.(jpe?g|png|webp|gif)$/i.test(f)) continue;
      files.push(path.join(imagesDir, f));
    }
  }
  return files;
}

function findLocalImage(searchDirs, url, html, alt) {
  const files = listContentImages(searchDirs);
  if (!files.length) return null;

  const uuid = uuidFromUrl(url);
  if (uuid) {
    const hit = files.find((f) => path.basename(f).toLowerCase().includes(uuid));
    if (hit) return hit;
  }

  const base = basenameFromUrl(url);
  if (base && base !== '[image_url]') {
    const hit = files.find((f) => path.basename(f).toLowerCase() === base);
    if (hit) return hit;
  }

  if (html && alt) {
    const tags = html.match(/<img[^>]+>/gi) || [];
    for (const tag of tags) {
      const tagAlt = tag.match(/alt="([^"]*)"/i)?.[1] ?? '';
      if (!tagAlt || tagAlt !== alt) continue;
      const tagSrc = tag.match(/src="([^"]+)"/i)?.[1];
      const tagUuid = uuidFromUrl(tagSrc || '');
      if (tagUuid) {
        const hit = files.find((f) => path.basename(f).toLowerCase().includes(tagUuid));
        if (hit) return hit;
      }
    }
  }

  return null;
}

function copyImageToPublic(localPath, publicPath) {
  const dest = path.join(PUBLIC_DIR, publicPath.replace(/^\//, ''));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(localPath, dest);
  return dest;
}

function syncNewsletterImages(folder, html, slug, issueNumber, trackFolder, track, log) {
  const searchDirs = [path.join(folder.dir, 'images'), folder.dir];
  const { cover, inline } =
    track === 'learn' ? getEduOrderedImages(html) : getOrderedImages(html, track);
  let copied = 0;
  let missing = 0;

  const heroPath = `/images/newsletters/${trackFolder}/issue-${String(issueNumber).padStart(2, '0')}.jpg`;
  if (cover) {
    const local = findLocalImage(searchDirs, cover.src, html, cover.alt);
    if (local) {
      copyImageToPublic(local, heroPath);
      copied++;
      log(`  ✓ hero issue-${String(issueNumber).padStart(2, '0')} ← ${path.basename(local)}`);
    } else {
      missing++;
      log(`  ! hero issue-${String(issueNumber).padStart(2, '0')} not found locally`);
    }
  }

  for (let i = 0; i < inline.length; i++) {
    const fig = inline[i];
    const ext = extFromUrl(fig.src);
    const publicPath = `/images/newsletters/${trackFolder}/${slug}-fig-${i + 1}${ext}`;
    const local = findLocalImage(searchDirs, fig.src, html, fig.alt);
    if (local) {
      copyImageToPublic(local, publicPath);
      copied++;
      log(`  ✓ ${slug}-fig-${i + 1} ← ${path.basename(local)}`);
    } else {
      missing++;
      log(`  ! ${slug}-fig-${i + 1} not found (${fig.alt || fig.src.slice(-40)})`);
    }
  }

  return { copied, missing };
}

export function syncEduImages(options = {}) {
  const eduSrc = options.eduSrc || EDU_SRC;
  const quiet = options.quiet ?? false;
  const log = quiet ? () => {} : console.log;
  let copied = 0;
  let missing = 0;

  const learn = listIssueFolders(eduSrc, /issue_(\d+)/);
  log('[sync-edu-images] Syncing from', eduSrc);

  for (const n of Object.keys(learn).sort((a, b) => a - b)) {
    const folder = learn[n];
    const slug = SLUGS.learn[String(folder.issue)];
    const html = folder.htmlPath ? fs.readFileSync(folder.htmlPath, 'utf-8') : '';
    if (!html) continue;
    const r = syncNewsletterImages(
      folder,
      html,
      slug,
      folder.issue,
      'thursday-lesson',
      'learn',
      log
    );
    copied += r.copied;
    missing += r.missing;
  }

  log(`[sync-edu-images] Copied ${copied} images, ${missing} still missing`);
  return { copied, missing };
}

export function syncCulturalImages(options = {}) {
  const culturalSrc = options.culturalSrc || CULTURAL_SRC;
  const quiet = options.quiet ?? false;
  const log = quiet ? () => {} : console.log;
  let copied = 0;
  let missing = 0;

  const cultural = listIssueFolders(culturalSrc, /issue_(\d+)/);
  log('[sync-cultural-images] Syncing from', culturalSrc);

  for (const n of Object.keys(cultural).sort((a, b) => a - b)) {
    const folder = cultural[n];
    const slug = SLUGS.cultural[String(folder.issue)];
    const html = folder.htmlPath ? fs.readFileSync(folder.htmlPath, 'utf-8') : '';
    if (!html) continue;
    const r = syncNewsletterImages(folder, html, slug, folder.issue, 'cultural', 'cultural', log);
    copied += r.copied;
    missing += r.missing;
  }

  log(`[sync-cultural-images] Copied ${copied} images, ${missing} still missing`);
  return { copied, missing };
}

// ---------------------------------------------------------------------------
// MDX builder
// ---------------------------------------------------------------------------

function buildMdx(edition, imageGaps) {
  const {
    slug,
    track,
    issueNumber,
    subjectLine,
    title,
    titleAr,
    titleZh,
    publishDate,
    excerpt,
    tags,
    bodyMd,
    extraImports = [],
    heroPath,
    heroSourceUrl = '',
  } = edition;

  const category = track === 'cultural' ? 'Bridge' : 'Learn';
  const series = track;
  const label = track === 'cultural' ? 'Bridge' : 'Learn';
  const canonical = `https://falafelinhotpot.com/editions/${slug}`;

  if (!fileExists(heroPath)) {
    imageGaps.push({
      slug,
      fig: 'hero',
      alt: title,
      publicPath: heroPath,
      sourceUrl: heroSourceUrl,
    });
  }

  const imports = [
    ...new Set([
      ...extraImports,
      "import EditionCTA from '~/components/editions/EditionCTA.astro';",
    ]),
  ];

  const ctaText =
    track === 'cultural'
      ? 'Join the cultural bridge — one edition at a time.'
      : 'Keep learning — one Thursday lesson at a time.';

  const frontmatter = `---
publishDate: ${publishDate}
title: ${yamlString(title)}
${titleZh ? `titleZh: ${yamlString(titleZh)}\n` : ''}${titleAr ? `titleAr: ${yamlString(titleAr)}\n` : ''}excerpt: ${yamlString(excerpt)}
category: ${category}
series: ${series}
issueNumber: ${issueNumber}
subjectLine: ${yamlString(subjectLine)}
${track === 'cultural' ? 'bilingual: true\n' : 'bilingual: false\n'}tags: ${yamlArray(tags)}
author: ${yamlString('Falafel')}
image: ${yamlString(heroPath)}
draft: false
metadata:
  title: ${yamlString(`${label} #${issueNumber}: ${subjectLine} | Falafel in Hotpot`)}
  description: ${yamlString(excerpt)}
  canonical: ${yamlString(canonical)}
  openGraph:
    type: article
  twitter:
    cardType: summary_large_image
---`;

  return `${frontmatter}\n\n${imports.join('\n')}\n\n${bodyMd}\n\n<EditionCTA text=${yamlString(ctaText)} />\n`;
}

function extractTags(subjectLine, bodyMd, track) {
  const tags = new Set();
  const words = subjectLine
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/);
  for (const w of ['chinese', 'arabic', 'culture', 'language', 'grammar', 'characters']) {
    if (words.includes(w) || bodyMd.toLowerCase().includes(w)) tags.add(w);
  }
  if (track === 'cultural') tags.add('cultural bridge');
  if (track === 'learn') tags.add('thursday lesson');
  return [...tags].slice(0, 6);
}

function extractTitleZh(text, track) {
  if (track !== 'cultural') {
    const m = text.match(/象形字/);
    if (m) return '象形字';
    return '';
  }
  const m = text.match(/字 of the Week[\s\S]{0,200}?^([\u4e00-\u9fff]{1,4})\s*$/m);
  if (m) return m[1];
  const inline = text.match(/<span class="zh">([\u4e00-\u9fff]{1,4})<\/span>/);
  return inline?.[1] || '';
}

function processEdition(folder, track, imageGaps) {
  const issueNumber = folder.issue;
  const slug = SLUGS[track][String(issueNumber)];
  if (!slug) throw new Error(`No slug for ${track} #${issueNumber}`);

  const rawText = fs.readFileSync(folder.txtPath, 'utf-8');
  const html = folder.htmlPath ? fs.readFileSync(folder.htmlPath, 'utf-8') : '';
  const lines = decodeEntities(rawText).split('\n');

  const subjectLine = folder.subject.replace(/\s+$/, '');
  const title =
    track === 'cultural'
      ? titleCase(subjectLine.split('.')[0].split('—')[0].trim())
      : titleCase(subjectLine.replace(/\.$/, ''));
  const titleAr = track === 'cultural' ? extractTitleAr(lines, subjectLine) : '';
  const publishDate = folder.sdate ? folder.sdate.slice(0, 10) : '2026-01-01';

  const trackFolder = track === 'cultural' ? 'cultural' : 'thursday-lesson';
  const heroPath = `/images/newsletters/${trackFolder}/issue-${String(issueNumber).padStart(2, '0')}.jpg`;

  let bodyMd;
  let extraImports = [];
  let heroSourceUrl = '';

  if (track === 'learn' && html) {
    const parsed = parseEduNewsletterHtml(html, {
      slug,
      trackFolder,
      publicDir: PUBLIC_DIR,
    });
    bodyMd = parsed.bodyMd;
    extraImports = parsed.imports;
    heroSourceUrl = parsed.coverSrc || '';
    for (const gap of parsed.imageGaps) imageGaps.push(gap);
  } else if (html) {
    const parsed = parseNewsletterHtml(html, {
      slug,
      trackFolder,
      publicDir: PUBLIC_DIR,
      track,
    });
    bodyMd = parsed.bodyMd;
    extraImports = parsed.imports;
    heroSourceUrl = parsed.coverSrc || '';
    for (const gap of parsed.imageGaps) imageGaps.push(gap);
  } else {
    bodyMd = bodyToMdx(rawText, { track, issueNumber, subjectLine, titleAr });
  }

  const excerpt = truncate(
    bodyMd
      .replace(/<[^>]+>/g, '')
      .replace(/\{[^}]+\}/g, '')
      .replace(/\*\*/g, '')
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length > 50 && !/^and the pictures/i.test(l)) || subjectLine
  );

  const mdx = buildMdx(
    {
      slug,
      track,
      issueNumber,
      subjectLine,
      title,
      titleAr,
      titleZh: extractTitleZh(bodyMd, track),
      publishDate,
      excerpt,
      tags: extractTags(subjectLine, bodyMd, track),
      bodyMd,
      extraImports,
      heroPath,
      heroSourceUrl,
    },
    imageGaps
  );

  return { slug, mdx, folder: folder.name, publishDate, subjectLine };
}

function writeManifest(imageGaps) {
  const bySlug = {};
  for (const gap of imageGaps) {
    if (!bySlug[gap.slug]) bySlug[gap.slug] = [];
    bySlug[gap.slug].push(gap);
  }

  let md = `# Missing newsletter images\n\nGenerated by \`npm run import:editions\`. Add files to \`public/\` at the paths below, or run a download pass from the source URLs.\n\n`;
  md += `Total gaps: **${imageGaps.length}**\n\n`;

  for (const slug of Object.keys(bySlug).sort()) {
    md += `## ${slug}\n\n`;
    md += `| Slot | Alt | Local path | Source URL |\n|------|-----|------------|------------|\n`;
    for (const g of bySlug[slug]) {
      const slot = g.fig === 'hero' ? 'hero' : `fig-${g.fig}`;
      md += `| ${slot} | ${g.alt.replace(/\|/g, '\\|')} | \`${g.publicPath}\` | ${g.sourceUrl || '—'} |\n`;
    }
    md += '\n';
  }

  fs.writeFileSync(MANIFEST_PATH, md, 'utf-8');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function importEditions(options = {}) {
  const culturalSrc = options.culturalSrc || CULTURAL_SRC;
  const eduSrc = options.eduSrc || EDU_SRC;
  const outDir = options.outDir || OUT_DIR;
  const quiet = options.quiet ?? false;
  const log = quiet ? () => {} : console.log;

  fs.mkdirSync(outDir, { recursive: true });

  const imageGaps = [];
  const results = [];

  const cultural = listIssueFolders(culturalSrc, /issue_(\d+)/);
  const learn = listIssueFolders(eduSrc, /issue_(\d+)/);

  log('[import-editions] Canonical cultural folders:');
  for (const n of Object.keys(cultural).sort((a, b) => a - b)) {
    log(`  #${n} → ${cultural[n].name} (${cultural[n].sdate.slice(0, 10)})`);
  }
  log('[import-editions] Canonical learn folders:');
  for (const n of Object.keys(learn).sort((a, b) => a - b)) {
    log(`  #${n} → ${learn[n].name} (${learn[n].sdate.slice(0, 10)})`);
  }

  syncEduImages({ eduSrc, quiet });
  syncCulturalImages({ culturalSrc, quiet });

  // Remove old edition files
  for (const f of fs.readdirSync(outDir)) {
    if (f.endsWith('.mdx') && (f.startsWith('cultural-') || f.startsWith('thursday-lesson-'))) {
      fs.unlinkSync(path.join(outDir, f));
    }
  }

  for (const n of Object.keys(cultural).sort((a, b) => a - b)) {
    const result = processEdition(cultural[n], 'cultural', imageGaps);
    fs.writeFileSync(path.join(outDir, `${result.slug}.mdx`), result.mdx, 'utf-8');
    results.push(result);
    log(`  ✓ ${result.slug}.mdx ← ${result.folder}`);
  }

  for (const n of Object.keys(learn).sort((a, b) => a - b)) {
    const result = processEdition(learn[n], 'learn', imageGaps);
    fs.writeFileSync(path.join(outDir, `${result.slug}.mdx`), result.mdx, 'utf-8');
    results.push(result);
    log(`  ✓ ${result.slug}.mdx ← ${result.folder}`);
  }

  writeManifest(imageGaps);
  log(`[import-editions] Wrote ${results.length} editions → ${outDir}`);
  log(`[import-editions] Image gaps: ${imageGaps.length} → ${MANIFEST_PATH}`);

  return { results, imageGaps };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const syncOnly = process.argv.includes('--sync-edu-images');
  if (syncOnly) {
    syncEduImages();
  } else {
    importEditions();
  }
}
