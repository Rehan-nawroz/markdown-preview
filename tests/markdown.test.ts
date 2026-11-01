import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../src/lib/markdown';

function parse(source: string): HTMLDivElement {
  const host = document.createElement('div');
  host.innerHTML = renderMarkdown(source);
  return host;
}

describe('markdown rendering', () => {
  it('renders GFM tables inside the scroll wrapper', () => {
    const html = renderMarkdown('| a | b |\n| --- | --- |\n| 1 | 2 |\n');
    expect(html).toContain('<div class="table-wrap">');
    expect(html).toContain('<th>a</th>');
    expect(html).toContain('<td>1</td>');
  });

  it('renders task list items as checkboxes', () => {
    const host = parse('- [ ] todo\n- [x] done\n');
    const items = host.querySelectorAll('li.task-list-item');
    expect(items.length).toBe(2);
    const boxes = host.querySelectorAll('input[type="checkbox"]');
    expect(boxes.length).toBe(2);
    expect((boxes[1] as HTMLInputElement).hasAttribute('checked')).toBe(true);
  });

  it('renders footnote references and the footnotes section', () => {
    const html = renderMarkdown('Text with a note[^1].\n\n[^1]: The note body.\n');
    expect(html).toContain('footnote-ref');
    expect(html).toContain('The note body.');
    expect(html).toContain('footnotes');
  });

  it('wraps fenced code in the copyable code block with highlighting', () => {
    const html = renderMarkdown('```js\nconst a = 1;\n```\n');
    expect(html).toContain('class="code-block"');
    expect(html).toContain('code-block__copy');
    expect(html).toContain('data-copy-code="true"');
    expect(html).toContain('language-js');
    expect(html).toContain('hljs-keyword');
  });

  it('falls back to an escaped plain code block for unknown languages', () => {
    const html = renderMarkdown('```not-a-language\n<b>raw</b>\n```\n');
    expect(html).toContain('code-block__lang">code<');
    expect(html).not.toContain('<b>raw</b>');
  });
});

describe('link rendering', () => {
  it('opens external links in a new tab with a safe rel', () => {
    const host = parse('[site](https://example.com)\n');
    const anchor = host.querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('https://example.com');
    expect(anchor?.getAttribute('target')).toBe('_blank');
    expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('leaves in-page anchors untouched', () => {
    const host = parse('[top](#top)\n');
    const anchor = host.querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('#top');
    expect(anchor?.hasAttribute('target')).toBe(false);
  });

  it('does not render javascript: URLs as links', () => {
    const host = parse('[x](javascript:alert(1))\n');
    expect(host.querySelector('a[href^="javascript"]')).toBeNull();
  });
});

describe('image rendering', () => {
  it('adds lazy loading and a referrer policy', () => {
    const host = parse('![alt](/img.png)\n');
    const image = host.querySelector('img');
    expect(image?.getAttribute('src')).toBe('/img.png');
    expect(image?.getAttribute('alt')).toBe('alt');
    expect(image?.getAttribute('loading')).toBe('lazy');
    expect(image?.getAttribute('decoding')).toBe('async');
    expect(image?.getAttribute('referrerpolicy')).toBe('no-referrer');
  });
});

describe('sanitization', () => {
  it('drops raw script markup', () => {
    const host = parse('<script>alert(1)</script>\n\nAfter.\n');
    expect(host.querySelector('script')).toBeNull();
    expect(host.textContent).toContain('After.');
  });

  it('drops inline event handlers on raw HTML', () => {
    const host = parse('<img src=x onerror="alert(1)">\n');
    expect(host.querySelector('img')).toBeNull();
    for (const element of Array.from(host.querySelectorAll('*'))) {
      expect(element.hasAttribute('onerror')).toBe(false);
    }
  });

  it('drops raw style elements and style attributes', () => {
    const host = parse('<style>body { display: none }</style>\n\n<p style="color:red">hi</p>\n');
    expect(host.querySelector('style')).toBeNull();
    expect(host.querySelector('[style]')).toBeNull();
  });

  it('keeps the code block wrapper and copy button through sanitization', () => {
    const host = parse('```bash\necho hi\n```\n');
    expect(host.querySelector('.code-block')).not.toBeNull();
    expect(host.querySelector('[data-copy-code]')).not.toBeNull();
    expect(host.querySelector('[data-copy-code]')?.getAttribute('aria-label')).toBe('Copy code');
  });
});
