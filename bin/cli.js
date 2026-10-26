#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { checkOpenGraph, extractSocial, lintSocial, previews } from '../src/index.js';

const HELP = `Usage: og-debugger <url> [options]
       og-debugger --file page.html

Fetches a page as the Facebook crawler, reads its Open Graph and Twitter Card
tags, downloads the share image (size, format, weight) and shows what
Facebook, LinkedIn and X will display.

Options:
  --file <path>     Analyse a local HTML file (no image download)
  --ua <agent>      User agent to send (default: facebookexternalhit)
  --no-image        Do not download the image
  --all             Print every og:/twitter:/article: tag
  --json            Print JSON
  --strict          Exit with code 1 on warnings too
  -h, --help        Show this help

Online version (no install): https://promopilot.link/en/tools/og-debugger.php
`;

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const value = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
if (!args.length || flag('-h') || flag('--help')) { process.stdout.write(HELP); process.exit(args.length ? 0 : 2); }

const color = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (color ? `\x1b[${code}m${s}\x1b[0m` : s);
const ICON = { error: c(31, '✖'), warning: c(33, '!'), info: c(36, 'i') };
const valued = new Set(['--file', '--ua']);
const cut = (s, n = 90) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : s ?? c(2, '(none)'));

try {
  let report;
  if (value('--file')) {
    const s = extractSocial(readFileSync(value('--file'), 'utf8'));
    const issues = lintSocial(s);
    report = { file: value('--file'), ...s, image: null, previews: previews(s), issues, ok: !issues.some((i) => i.level === 'error') };
  } else {
    report = await checkOpenGraph(args.find((a, i) => !a.startsWith('-') && !valued.has(args[i - 1])), { userAgent: value('--ua'), checkImage: !flag('--no-image') });
  }
  if (flag('--json')) console.log(JSON.stringify(report, null, 2));
  else {
    if (report.finalUrl) console.log(`${c(1, 'URL:')} ${report.finalUrl}  (HTTP ${report.status})\n`);
    for (const [name, p] of Object.entries(report.previews)) {
      console.log(`  ${c(1, name === 'x' ? 'X / Twitter' : name[0].toUpperCase() + name.slice(1))}${p.card ? c(2, `  (${p.card})`) : ''}`);
      console.log(`    ${cut(p.title)}`);
      console.log(`    ${c(2, cut(p.description))}`);
    }
    const img = report.image;
    console.log(`\n  ${c(1, 'Image:')} ${img ? `${img.url}\n          ${img.type ?? '?'} ${img.width ?? '?'}×${img.height ?? '?'}, ${Math.round(img.bytes / 1024)} KB, HTTP ${img.status}` : cut(report.previews.facebook.image)}`);
    if (flag('--all')) { console.log(''); for (const [k, v] of Object.entries({ ...report.og, ...report.twitter })) console.log(`  ${c(2, k.padEnd(24))} ${[].concat(v).join(' | ')}`); }
    console.log('');
    if (!report.issues.length) console.log(c(32, '✔ Social tags look good'));
    for (const i of report.issues) console.log(`  ${ICON[i.level]} ${i.message}`);
  }
  const failing = report.issues.filter((i) => i.level === 'error' || (flag('--strict') && i.level === 'warning'));
  process.exit(failing.length ? 1 : 0);
} catch (err) {
  console.error(c(31, `Error: ${err.message}`));
  process.exit(2);
}
