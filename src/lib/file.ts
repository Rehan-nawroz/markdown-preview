import { ACCEPTED_EXTENSIONS, ACCEPTED_MIME_TYPES } from './constants';

export type Eol = '\n' | '\r\n';

export interface ParsedMarkdownFile {
  text: string;
  eol: Eol;
  bom: boolean;
}

export function isAcceptedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const hasExtension = ACCEPTED_EXTENSIONS.some((extension) => name.endsWith(extension));
  if (hasExtension) return true;
  return (ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type);
}

export function detectEol(text: string): Eol {
  const crlf = text.match(/\r\n/g)?.length ?? 0;
  const lf = text.match(/\n/g)?.length ?? 0;
  return crlf > 0 && crlf === lf ? '\r\n' : '\n';
}

export async function readMarkdownFile(file: File): Promise<ParsedMarkdownFile> {
  // Inspect the raw bytes: UTF-8 decoding strips a leading BOM, so it can only be
  // detected before decoding. `TextDecoder` then removes it from the text.
  const bytes = new Uint8Array(await file.arrayBuffer());
  const bom = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
  const raw = new TextDecoder('utf-8').decode(bytes);
  return {
    text: raw.replace(/\r\n?/g, '\n'),
    eol: detectEol(raw),
    bom,
  };
}

export function serializeText(text: string, eol: Eol, bom: boolean): string {
  const normalized = text.replace(/\r\n?/g, '\n');
  const withEol = eol === '\r\n' ? normalized.replace(/\n/g, '\r\n') : normalized;
  return bom ? `\uFEFF${withEol}` : withEol;
}

export function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? '';
  const cleaned = base
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '')
    .replace(/\.+$/, '');
  return cleaned || 'untitled.md';
}

export function ensureMarkdownExtension(name: string): string {
  const clean = sanitizeFilename(name);
  const lower = clean.toLowerCase();
  if (ACCEPTED_EXTENSIONS.some((extension) => lower.endsWith(extension))) return clean;
  return `${clean}.md`;
}

export function stripExtension(name: string): string {
  const lower = name.toLowerCase();
  const match = ACCEPTED_EXTENSIONS.find((extension) => lower.endsWith(extension));
  return match ? name.slice(0, -match.length) : name;
}

export function downloadText(
  name: string,
  text: string,
  mime = 'text/markdown;charset=utf-8',
): void {
  const cleaned = sanitizeFilename(name);
  const hasExtension = /\.[a-z0-9]{1,8}$/i.test(cleaned);
  const filename = hasExtension ? cleaned : ensureMarkdownExtension(cleaned);
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/u).filter(Boolean).length;
}

export function countChars(text: string): number {
  return text.length;
}

export function readMinutes(words: number): number {
  if (words === 0) return 0;
  return Math.max(1, Math.ceil(words / 200));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (typeof error === 'object' && error !== null && (error as { name?: string }).name === 'AbortError')
  );
}
