import { describe, expect, it } from 'vitest';
import {
  countChars,
  countWords,
  detectEol,
  ensureMarkdownExtension,
  formatNumber,
  isAbortError,
  isAcceptedFile,
  readMinutes,
  readMarkdownFile,
  sanitizeFilename,
  serializeText,
  stripExtension,
} from '../src/lib/file';

describe('detectEol', () => {
  it('detects CRLF when every newline is a pair', () => {
    expect(detectEol('a\r\nb\r\nc')).toBe('\r\n');
  });

  it('defaults to LF for plain and mixed line endings', () => {
    expect(detectEol('a\nb\nc')).toBe('\n');
    expect(detectEol('a\r\nb\nc')).toBe('\n');
    expect(detectEol('no newlines')).toBe('\n');
  });
});

describe('serializeText', () => {
  it('round-trips CRLF content with a BOM', () => {
    const original = '\uFEFF# Title\r\n\r\nBody';
    const serialized = serializeText('# Title\r\n\r\nBody', '\r\n', true);
    expect(serialized).toBe(original);
  });

  it('round-trips LF content without a BOM', () => {
    const serialized = serializeText('# Title\n\nBody', '\n', false);
    expect(serialized).toBe('# Title\n\nBody');
    expect(serialized).not.toContain('\r');
  });

  it('normalizes mixed line endings before applying the target EOL', () => {
    expect(serializeText('a\r\nb\nc', '\r\n', false)).toBe('a\r\nb\r\nc');
    expect(serializeText('a\r\nb\nc', '\n', false)).toBe('a\nb\nc');
  });
});

describe('readMarkdownFile', () => {
  it('strips the BOM and normalizes to LF while remembering the original EOL', async () => {
    const file = new File(['\uFEFFone\r\ntwo\r\n'], 'notes.md', { type: 'text/markdown' });
    const parsed = await readMarkdownFile(file);
    expect(parsed.bom).toBe(true);
    expect(parsed.eol).toBe('\r\n');
    expect(parsed.text).toBe('one\ntwo\n');
  });

  it('reports no BOM and LF for plain files', async () => {
    const file = new File(['one\ntwo'], 'notes.md', { type: 'text/markdown' });
    const parsed = await readMarkdownFile(file);
    expect(parsed.bom).toBe(false);
    expect(parsed.eol).toBe('\n');
    expect(parsed.text).toBe('one\ntwo');
  });
});

describe('isAcceptedFile', () => {
  it('accepts the supported extensions case-insensitively', () => {
    expect(isAcceptedFile(new File([''], 'a.md'))).toBe(true);
    expect(isAcceptedFile(new File([''], 'a.MARKDOWN'))).toBe(true);
    expect(isAcceptedFile(new File([''], 'a.txt'))).toBe(true);
  });

  it('accepts markdown and plain-text MIME types without a known extension', () => {
    expect(isAcceptedFile(new File([''], 'a', { type: 'text/markdown' }))).toBe(true);
    expect(isAcceptedFile(new File([''], 'a', { type: 'text/plain' }))).toBe(true);
  });

  it('rejects unsupported files', () => {
    expect(isAcceptedFile(new File([''], 'a.png', { type: 'image/png' }))).toBe(false);
    expect(isAcceptedFile(new File([''], 'a.doc'))).toBe(false);
  });
});

describe('sanitizeFilename', () => {
  it('drops path segments and illegal characters', () => {
    expect(sanitizeFilename('C:\\docs\\my<note>?.md')).toBe('my-note--.md');
    expect(sanitizeFilename('../../etc/passwd')).toBe('passwd');
  });

  it('collapses whitespace and trims dots', () => {
    expect(sanitizeFilename('  spaced   name.md  ')).toBe('spaced name.md');
    expect(sanitizeFilename('...hidden.md...')).toBe('hidden.md');
  });

  it('falls back when nothing usable remains', () => {
    expect(sanitizeFilename('')).toBe('untitled.md');
    expect(sanitizeFilename('   ')).toBe('untitled.md');
  });
});

describe('ensureMarkdownExtension', () => {
  it('keeps an existing markdown extension', () => {
    expect(ensureMarkdownExtension('notes.md')).toBe('notes.md');
    expect(ensureMarkdownExtension('notes.MARKDOWN')).toBe('notes.MARKDOWN');
    expect(ensureMarkdownExtension('notes.txt')).toBe('notes.txt');
  });

  it('appends .md when the extension is missing or foreign', () => {
    expect(ensureMarkdownExtension('notes')).toBe('notes.md');
    expect(ensureMarkdownExtension('notes.html')).toBe('notes.html.md');
  });
});

describe('stripExtension', () => {
  it('removes only recognised markdown extensions', () => {
    expect(stripExtension('notes.md')).toBe('notes');
    expect(stripExtension('notes.markdown')).toBe('notes');
    expect(stripExtension('notes.html')).toBe('notes.html');
  });
});

describe('counts', () => {
  it('counts words and characters', () => {
    expect(countWords('  one two   three ')).toBe(3);
    expect(countWords('')).toBe(0);
    expect(countWords('   \n ')).toBe(0);
    expect(countChars('abc\n')).toBe(4);
  });

  it('derives reading minutes from the word count', () => {
    expect(readMinutes(0)).toBe(0);
    expect(readMinutes(1)).toBe(1);
    expect(readMinutes(200)).toBe(1);
    expect(readMinutes(201)).toBe(2);
  });

  it('formats numbers for the status bar', () => {
    expect(formatNumber(1200)).toMatch(/1.?200/);
  });
});

describe('isAbortError', () => {
  it('recognises picker cancellation', () => {
    expect(isAbortError(new DOMException('cancelled', 'AbortError'))).toBe(true);
    expect(isAbortError({ name: 'AbortError' })).toBe(true);
  });

  it('ignores everything else', () => {
    expect(isAbortError(new Error('boom'))).toBe(false);
    expect(isAbortError(null)).toBe(false);
    expect(isAbortError('AbortError')).toBe(false);
  });
});
