import tokensCss from '../styles/tokens.css?raw';
import previewCss from '../styles/preview.css?raw';
import printCss from '../styles/print.css?raw';
import { stripExtension } from './file';
import { renderMarkdown } from './markdown';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const EXPORT_CSS = `
html, body { min-height: 100%; background: #000000; }
body.export-body {
  margin: 0;
  padding: 40px 16px 64px;
  background: #000000;
  font-family: var(--font-ui);
}
.export-page {
  max-width: 760px;
  margin: 0 auto;
  padding: 40px 48px;
  border: 1px solid #222222;
  border-radius: 12px;
  background: #0a0a0a;
  box-shadow: 0 16px 40px -10px rgba(0, 0, 0, 0.9), 0 0 0 1px #222222;
}
@media (max-width: 768px) {
  body.export-body { padding: 0; }
  .export-page { padding: 28px 22px; border: 0; border-radius: 0; }
}
@media print {
  body.export-body { padding: 0; background: #ffffff; }
  .export-page { max-width: none; padding: 0; border: 0; border-radius: 0; background: #ffffff; box-shadow: none; }
}
`;

export function createStandaloneHtml(source: string, name: string): string {
  const title = stripExtension(name) || 'Markform document';
  const body = renderMarkdown(source);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="generator" content="Markform" />
<title>${escapeHtml(title)}</title>
<style>
${tokensCss}
${previewCss}
${printCss}
${EXPORT_CSS}
</style>
</head>
<body class="export-body">
<main class="export-page">
<article class="markdown-body">
${body}
</article>
</main>
</body>
</html>
`;
}
