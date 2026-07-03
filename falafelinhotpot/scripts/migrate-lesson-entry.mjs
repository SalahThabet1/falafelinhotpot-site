#!/usr/bin/env node
/**
 * One-off migration: LessonCard + MDX ## headings → LessonEntry with heading prop.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const editionsDir = path.join(__dirname, '../src/content/editions');

function stripHeadingHtml(s) {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function migrateBody(body) {
  body = body.replace(
    /import LessonCard from '~\/components\/editions\/LessonCard\.astro';/g,
    "import LessonEntry from '~/components/editions/LessonEntry.astro';",
  );
  body = body.replace(/<LessonCard\b/g, '<LessonEntry');

  // Single-line self-closing entries: ## heading ... <LessonEntry ... />
  body = body.replace(
    /^## ([^\n]+)\n\n((?:[^\n]*\n)*?)<LessonEntry((?![^>]*heading=)[^>]*)\/>/gm,
    (match, headingRaw, middle, attrs) => {
      const heading = stripHeadingHtml(headingRaw);
      const proseOnly = middle.replace(/<EditionFigure[\s\S]*?\/>/g, '').trim();
      const hidePhrase = /<span class="zh">/.test(headingRaw) && proseOnly.length > 20;
      const inject = ` heading={${JSON.stringify(heading)}}${hidePhrase ? ' hidePhrase' : ''}`;
      return `${middle}<LessonEntry${inject}${attrs} />`;
    },
  );

  // Multi-line entries
  body = body.replace(
    /^## ([^\n]+)\n\n((?:[^\n]*\n)*?)<LessonEntry\n((?![\s\S]*heading=)[\s\S]*?)\/>/gm,
    (match, headingRaw, middle, attrs) => {
      const heading = stripHeadingHtml(headingRaw);
      const proseOnly = middle.replace(/<EditionFigure[\s\S]*?\/>/g, '').trim();
      const hidePhrase = /<span class="zh">/.test(headingRaw) && proseOnly.length > 20;
      const inject = ` heading={${JSON.stringify(heading)}}${hidePhrase ? ' hidePhrase' : ''}`;
      return `${middle}<LessonEntry${inject}\n${attrs.trimStart()}\n/>`;
    },
  );

  // Entries without preceding ## — derive heading from label prop
  body = body.replace(
    /<LessonEntry((?![^>]*heading=)[^>]*)\slabel=\{([^}]+)\}([^>]*)\/>/g,
    (match, before, label, after) => {
      const labelText = label.replace(/^"|"$|^'|'$/g, '').replace(/^\\"/, '').replace(/\\"$/, '');
      const heading = stripHeadingHtml(
        labelText
          .split(/\s*[—–-]\s*/)[0]
          .split(/\s+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' '),
      );
      return `<LessonEntry heading={${JSON.stringify(heading)}}${before} label={${label}}${after} />`;
    },
  );

  return body;
}

function migrateFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) return;
  const [, frontmatter, body] = fmMatch;
  if (!body.includes('LessonCard') && !body.includes('LessonEntry')) return;

  const migrated = migrateBody(body);
  fs.writeFileSync(filePath, `---\n${frontmatter}\n---\n${migrated}`);
  console.log('Migrated:', path.basename(filePath));
}

for (const name of fs.readdirSync(editionsDir)) {
  if (name.startsWith('thursday-lesson-') && name.endsWith('.mdx')) {
    migrateFile(path.join(editionsDir, name));
  }
}
