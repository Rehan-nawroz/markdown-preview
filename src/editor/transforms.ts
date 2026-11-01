export interface TextRange {
  from: number;
  to: number;
}

export interface TransformResult {
  text: string;
  from: number;
  to: number;
}

export interface TextChange {
  from: number;
  to: number;
  insert: string;
}

type LineKind = 'quote' | 'bullet' | 'ordered' | 'task';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeRange(text: string, range: TextRange): TextRange {
  const from = clamp(range.from, 0, text.length);
  const to = clamp(range.to, from, text.length);
  return { from, to };
}

function lineBounds(text: string, range: TextRange): { start: number; end: number } {
  const start = text.lastIndexOf('\n', Math.max(0, range.from - 1)) + 1;
  const found = text.indexOf('\n', range.to);
  const end = found === -1 ? text.length : found;
  return { start, end };
}

function selectionAfterLines(
  text: string,
  range: TextRange,
  start: number,
  end: number,
  oldBlock: string,
  newBlock: string,
  firstLineDelta: number,
): TransformResult {
  const newText = text.slice(0, start) + newBlock + text.slice(end);
  const totalDelta = newBlock.length - oldBlock.length;
  return {
    text: newText,
    from: clamp(range.from + firstLineDelta, start, start + newBlock.length),
    to: clamp(range.to + totalDelta, start, start + newBlock.length),
  };
}

function indentOf(line: string): string {
  return line.match(/^\s*/)?.[0] ?? '';
}

function stripListMarker(line: string): string {
  const indent = indentOf(line);
  const content = line
    .slice(indent.length)
    .replace(/^([-*+]|\d+[.)])\s+/, '')
    .replace(/^\[[ xX]\]\s+/, '');
  return `${indent}${content}`;
}

const LINE_PREFIXES: Record<
  LineKind,
  { prefix: string; matches: (line: string) => boolean; remove: (line: string) => string; add: (line: string) => string }
> = {
  quote: {
    prefix: '> ',
    matches: (line) => /^\s*>\s?/.test(line),
    remove: (line) => line.replace(/^(\s*)>\s?/, '$1'),
    add: (line) => {
      const indent = indentOf(line);
      return `${indent}> ${line.slice(indent.length)}`;
    },
  },
  bullet: {
    prefix: '- ',
    matches: (line) => /^\s*[-*+]\s+/.test(line),
    remove: (line) => line.replace(/^(\s*)[-*+]\s+(\[[ xX]\]\s+)?/, '$1'),
    add: (line) => {
      const stripped = stripListMarker(line);
      const indent = indentOf(stripped);
      return `${indent}- ${stripped.slice(indent.length)}`;
    },
  },
  ordered: {
    prefix: '1. ',
    matches: (line) => /^\s*\d+[.)]\s+/.test(line),
    remove: (line) => line.replace(/^(\s*)\d+[.)]\s+/, '$1'),
    add: (line) => {
      const stripped = stripListMarker(line);
      const indent = indentOf(stripped);
      return `${indent}1. ${stripped.slice(indent.length)}`;
    },
  },
  task: {
    prefix: '- [ ] ',
    matches: (line) => /^\s*[-*+]\s+\[[ xX]\]\s+/.test(line),
    remove: (line) => line.replace(/^(\s*)[-*+]\s+\[[ xX]\]\s+/, '$1'),
    add: (line) => {
      const stripped = stripListMarker(line);
      const indent = indentOf(stripped);
      return `${indent}- [ ] ${stripped.slice(indent.length)}`;
    },
  },
};

export function toggleWrap(text: string, range: TextRange, marker: string): TransformResult {
  const { from, to } = normalizeRange(text, range);
  const selected = text.slice(from, to);
  const markerLength = marker.length;

  const isWrappedSelection =
    selected.length >= markerLength * 2 &&
    selected.startsWith(marker) &&
    selected.endsWith(marker);

  if (isWrappedSelection) {
    const inner = selected.slice(markerLength, selected.length - markerLength);
    return {
      text: text.slice(0, from) + inner + text.slice(to),
      from,
      to: from + inner.length,
    };
  }

  const before = text.slice(Math.max(0, from - markerLength), from);
  const after = text.slice(to, Math.min(text.length, to + markerLength));
  const italicOverlapsBoldBefore =
    marker === '*' && text.slice(Math.max(0, from - 2), from) === '**';
  const italicOverlapsBoldAfter =
    marker === '*' && text.slice(to, Math.min(text.length, to + 2)) === '**';

  if (before === marker && after === marker && !italicOverlapsBoldBefore && !italicOverlapsBoldAfter) {
    return {
      text: text.slice(0, from - markerLength) + selected + text.slice(to + markerLength),
      from: from - markerLength,
      to: to - markerLength,
    };
  }

  if (selected.length === 0) {
    return {
      text: text.slice(0, from) + marker + marker + text.slice(to),
      from: from + markerLength,
      to: from + markerLength,
    };
  }

  return {
    text: text.slice(0, from) + marker + selected + marker + text.slice(to),
    from: from + markerLength,
    to: to + markerLength,
  };
}

export function toggleLinePrefix(text: string, range: TextRange, kind: LineKind): TransformResult {
  const normalized = normalizeRange(text, range);
  const { start, end } = lineBounds(text, normalized);
  const block = text.slice(start, end);
  const lines = block.split('\n');
  const config = LINE_PREFIXES[kind];
  const nonEmpty = lines.filter((line) => line.trim().length > 0);
  const shouldRemove = nonEmpty.length > 0 && nonEmpty.every(config.matches);

  const next = lines.map((line) => {
    if (line.trim().length === 0 && lines.length > 1) return line;
    if (shouldRemove) return config.remove(line);
    if (config.matches(line)) return line;
    return config.add(line);
  });

  const newBlock = next.join('\n');
  const firstLineDelta = next[0].length - lines[0].length;
  return selectionAfterLines(text, normalized, start, end, block, newBlock, firstLineDelta);
}

export function cycleHeading(text: string, range: TextRange): TransformResult {
  const normalized = normalizeRange(text, range);
  const { start, end } = lineBounds(text, normalized);
  const block = text.slice(start, end);
  const lines = block.split('\n');

  const next = lines.map((line) => {
    if (line.trim().length === 0) return line;
    const match = line.match(/^(\s*)(#{1,6})\s+(.*)$/);
    if (!match) {
      const indent = indentOf(line);
      return `${indent}# ${line.slice(indent.length)}`;
    }
    const [, indent, hashes, content] = match;
    if (hashes.length >= 3) return `${indent}${content}`;
    return `${indent}${'#'.repeat(hashes.length + 1)} ${content}`;
  });

  const newBlock = next.join('\n');
  const firstLineDelta = next[0].length - lines[0].length;
  return selectionAfterLines(text, normalized, start, end, block, newBlock, firstLineDelta);
}

export function insertLink(text: string, range: TextRange, image = false): TransformResult {
  const { from, to } = normalizeRange(text, range);
  const selected = text.slice(from, to);
  const selectedIsUrl = /^https?:\/\/\S+$/i.test(selected);
  const label = selectedIsUrl ? 'link text' : selected.length > 0 ? selected : image ? 'alt text' : 'link text';
  const url = selectedIsUrl ? selected : 'https://';
  const alt = image && selectedIsUrl ? 'alt text' : label;
  const snippet = image ? `![${alt}](${url})` : `[${label}](${url})`;
  const urlOffset = image ? 2 + alt.length + 2 : 1 + label.length + 2;

  return {
    text: text.slice(0, from) + snippet + text.slice(to),
    from: from + urlOffset,
    to: from + urlOffset + url.length,
  };
}

export function insertCodeBlock(text: string, range: TextRange): TransformResult {
  const { from, to } = normalizeRange(text, range);
  const selected = text.slice(from, to);
  const fence = '```';

  if (selected.length === 0) {
    const snippet = `${fence}\n\n${fence}`;
    return {
      text: text.slice(0, from) + snippet + text.slice(to),
      from: from + fence.length + 1,
      to: from + fence.length + 1,
    };
  }

  const snippet = `${fence}\n${selected}\n${fence}`;
  return {
    text: text.slice(0, from) + snippet + text.slice(to),
    from: from + fence.length + 1,
    to: from + fence.length + 1 + selected.length,
  };
}

export function insertTable(text: string, range: TextRange): TransformResult {
  const { from, to } = normalizeRange(text, range);
  const snippet = [
    '| Column 1 | Column 2 | Column 3 |',
    '| --- | --- | --- |',
    '|  |  |  |',
    '|  |  |  |',
  ].join('\n');
  const before = text.slice(0, from);
  const leading = before.length === 0 || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n';
  const after = text.slice(to);
  const trailing = after.length === 0 || after.startsWith('\n\n') ? '\n' : after.startsWith('\n') ? '\n' : '\n\n';
  const inserted = `${leading}${snippet}${trailing}`;
  const cellStart = from + leading.length + 2;

  return {
    text: text.slice(0, from) + inserted + after,
    from: cellStart,
    to: cellStart + 'Column 1'.length,
  };
}

export function insertRule(text: string, range: TextRange): TransformResult {
  const { from, to } = normalizeRange(text, range);
  const before = text.slice(0, from);
  const leading = before.length === 0 || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n';
  const after = text.slice(to);
  const trailing = after.length === 0 || after.startsWith('\n') ? '\n' : '\n\n';
  const inserted = `${leading}---${trailing}`;
  const caret = from + leading.length + 3 + 1;

  return {
    text: text.slice(0, from) + inserted + after,
    from: caret,
    to: caret,
  };
}

export function diffChange(oldText: string, newText: string): TextChange | null {
  if (oldText === newText) return null;

  let start = 0;
  while (start < oldText.length && start < newText.length && oldText[start] === newText[start]) {
    start += 1;
  }

  let oldEnd = oldText.length;
  let newEnd = newText.length;
  while (oldEnd > start && newEnd > start && oldText[oldEnd - 1] === newText[newEnd - 1]) {
    oldEnd -= 1;
    newEnd -= 1;
  }

  return {
    from: start,
    to: oldEnd,
    insert: newText.slice(start, newEnd),
  };
}
