import MarkdownIt from 'markdown-it';
import footnote from 'markdown-it-footnote';
import taskLists from 'markdown-it-task-lists';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import markdownLanguage from 'highlight.js/lib/languages/markdown';
import python from 'highlight.js/lib/languages/python';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';

hljs.registerLanguage('bash', bash);
hljs.registerLanguage('css', css);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('markdown', markdownLanguage);
hljs.registerLanguage('python', python);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);

const COPY_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path></svg>';

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: false,
});

md.use(taskLists, { enabled: false, label: false });
md.use(footnote);

md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  const info = token.info.trim().split(/\s+/)[0] ?? '';
  const code = token.content;
  const hasLanguage = info.length > 0 && hljs.getLanguage(info) !== undefined;
  const language = hasLanguage ? info : '';
  const highlighted =
    language.length > 0
      ? hljs.highlight(code, { language, ignoreIllegals: true }).value
      : code.length < 8000
        ? hljs.highlightAuto(code).value
        : md.utils.escapeHtml(code);
  const languageLabel = language || 'code';
  const languageClass = language ? ` language-${md.utils.escapeHtml(language)}` : '';

  return (
    '<div class="code-block">' +
    '<div class="code-block__bar">' +
    '<div class="code-block__left">' +
    '<span class="code-dots" aria-hidden="true">' +
    '<span class="code-dot code-dot--red"></span>' +
    '<span class="code-dot code-dot--amber"></span>' +
    '<span class="code-dot code-dot--green"></span>' +
    '</span>' +
    `<span class="code-block__lang">${md.utils.escapeHtml(languageLabel)}</span>` +
    '</div>' +
    `<button type="button" class="code-block__copy" data-copy-code="true" aria-label="Copy code">${COPY_ICON}<span>Copy</span></button>` +
    '</div>' +
    `<pre><code class="hljs${languageClass}">${highlighted}</code></pre>` +
    '</div>\n'
  );
};

md.renderer.rules.link_open = (tokens, idx, options, _env, self) => {
  const href = String(tokens[idx].attrGet('href') ?? '');
  if (!href.startsWith('#')) {
    tokens[idx].attrSet('target', '_blank');
    tokens[idx].attrSet('rel', 'noopener noreferrer');
  }
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  // `renderToken` emits attributes verbatim, so the alt text has to be resolved
  // from the image's inline children the way markdown-it's default rule does.
  token.attrSet('alt', self.renderInlineAsText(token.children ?? [], options, env));
  token.attrSet('loading', 'lazy');
  token.attrSet('decoding', 'async');
  token.attrSet('referrerpolicy', 'no-referrer');
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.table_open = () => '<div class="table-wrap"><table>\n';
md.renderer.rules.table_close = () => '</table></div>\n';

const SANITIZE_OPTIONS = {
  USE_PROFILES: { html: true, svg: true },
  ADD_ATTR: [
    'target',
    'rel',
    'loading',
    'referrerpolicy',
    'decoding',
    'data-copy-code',
    'aria-label',
    'disabled',
    'checked',
    'type',
    'id',
  ],
  FORBID_TAGS: ['style', 'form', 'iframe', 'object', 'embed', 'script'],
  FORBID_ATTR: ['style'],
};

export function renderMarkdown(source: string): string {
  const html = md.render(source);
  return DOMPurify.sanitize(html, SANITIZE_OPTIONS);
}

export function renderPlainHtml(source: string): string {
  return renderMarkdown(source);
}
