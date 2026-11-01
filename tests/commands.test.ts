import { describe, expect, it } from 'vitest';
import {
  cycleHeading,
  diffChange,
  insertCodeBlock,
  insertLink,
  insertRule,
  insertTable,
  toggleLinePrefix,
  toggleWrap,
} from '../src/editor/transforms';

describe('toggleWrap', () => {
  it('wraps a selection and keeps it selected', () => {
    const result = toggleWrap('hello world', { from: 0, to: 5 }, '**');
    expect(result.text).toBe('**hello** world');
    expect(result.text.slice(result.from, result.to)).toBe('hello');
  });

  it('unwraps a selection that is already wrapped', () => {
    const result = toggleWrap('**hello** world', { from: 2, to: 7 }, '**');
    expect(result.text).toBe('hello world');
    expect(result.text.slice(result.from, result.to)).toBe('hello');
  });

  it('unwraps when the markers sit just outside the selection', () => {
    const result = toggleWrap('~~gone~~', { from: 2, to: 6 }, '~~');
    expect(result.text).toBe('gone');
    expect(result.from).toBe(0);
    expect(result.to).toBe(4);
  });

  it('inserts a pair and puts the caret between it for an empty selection', () => {
    const result = toggleWrap('abc', { from: 3, to: 3 }, '*');
    expect(result.text).toBe('abc**');
    expect(result.from).toBe(4);
    expect(result.to).toBe(4);
  });

  it('adds italic markers around bold text without dropping either', () => {
    const result = toggleWrap('**bold**', { from: 2, to: 6 }, '*');
    expect(result.text).toBe('***bold***');
    expect(result.text.slice(result.from, result.to)).toBe('bold');
  });
});

describe('toggleLinePrefix', () => {
  it('adds and removes bullet markers across a block', () => {
    const added = toggleLinePrefix('one\ntwo', { from: 0, to: 7 }, 'bullet');
    expect(added.text).toBe('- one\n- two');

    const removed = toggleLinePrefix('- one\n- two', { from: 0, to: 11 }, 'bullet');
    expect(removed.text).toBe('one\ntwo');
  });

  it('toggles quotes and leaves blank lines alone', () => {
    const quoted = toggleLinePrefix('a\n\nb', { from: 0, to: 4 }, 'quote');
    expect(quoted.text).toBe('> a\n\n> b');

    const unquoted = toggleLinePrefix('> a\n\n> b', { from: 0, to: 8 }, 'quote');
    expect(unquoted.text).toBe('a\n\nb');
  });

  it('toggles ordered lists and task lists', () => {
    expect(toggleLinePrefix('item', { from: 0, to: 0 }, 'ordered').text).toBe('1. item');
    expect(toggleLinePrefix('1. item', { from: 0, to: 0 }, 'ordered').text).toBe('item');
    expect(toggleLinePrefix('item', { from: 0, to: 0 }, 'task').text).toBe('- [ ] item');
    expect(toggleLinePrefix('- [x] item', { from: 0, to: 0 }, 'task').text).toBe('item');
  });

  it('keeps indentation when prefixing', () => {
    expect(toggleLinePrefix('  nested', { from: 0, to: 0 }, 'bullet').text).toBe('  - nested');
  });

  it('only reformats the lines the selection touches', () => {
    const result = toggleLinePrefix('one\ntwo', { from: 4, to: 7 }, 'quote');
    expect(result.text).toBe('one\n> two');
    expect(result.text.slice(result.from, result.to)).toBe('two');
  });
});

describe('cycleHeading', () => {
  it('cycles a plain line h1 -> h2 -> h3 -> plain', () => {
    const h1 = cycleHeading('Title', { from: 0, to: 0 });
    expect(h1.text).toBe('# Title');

    const h2 = cycleHeading(h1.text, { from: 0, to: 0 });
    expect(h2.text).toBe('## Title');

    const h3 = cycleHeading(h2.text, { from: 0, to: 0 });
    expect(h3.text).toBe('### Title');

    const plain = cycleHeading(h3.text, { from: 0, to: 0 });
    expect(plain.text).toBe('Title');
  });

  it('keeps existing headings deeper than three levels intact when cycling down', () => {
    expect(cycleHeading('###### deep', { from: 0, to: 0 }).text).toBe('deep');
  });
});

describe('insertLink', () => {
  it('inserts a placeholder link and selects the URL', () => {
    const result = insertLink('', { from: 0, to: 0 });
    expect(result.text).toBe('[link text](https://)');
    expect(result.text.slice(result.from, result.to)).toBe('https://');
  });

  it('uses the selected text as the label', () => {
    const result = insertLink('selected words', { from: 0, to: 14 });
    expect(result.text).toBe('[selected words](https://)');
  });

  it('uses a selected URL as the destination', () => {
    const result = insertLink('https://example.com', { from: 0, to: 19 });
    expect(result.text).toBe('[link text](https://example.com)');
    expect(result.text.slice(result.from, result.to)).toBe('https://example.com');
  });

  it('inserts image syntax with alt text', () => {
    const result = insertLink('', { from: 0, to: 0 }, true);
    expect(result.text).toBe('![alt text](https://)');
    expect(result.text.slice(result.from, result.to)).toBe('https://');
  });
});

describe('insertTable', () => {
  it('inserts a three-column table and selects the first header cell', () => {
    const result = insertTable('', { from: 0, to: 0 });
    expect(result.text.startsWith('| Column 1 | Column 2 | Column 3 |')).toBe(true);
    expect(result.text).toContain('| --- | --- | --- |');
    expect(result.text.endsWith('\n')).toBe(true);
    expect(result.text.slice(result.from, result.to)).toBe('Column 1');
  });

  it('separates the table from surrounding text with blank lines', () => {
    const result = insertTable('before', { from: 6, to: 6 });
    expect(result.text).toBe(
      'before\n\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n|  |  |  |\n|  |  |  |\n',
    );
  });
});

describe('insertCodeBlock', () => {
  it('inserts an empty fenced block with the caret inside', () => {
    const result = insertCodeBlock('', { from: 0, to: 0 });
    expect(result.text).toBe('```\n\n```');
    expect(result.from).toBe(4);
    expect(result.to).toBe(4);
  });

  it('wraps the selection in a fence and keeps it selected', () => {
    const result = insertCodeBlock('code', { from: 0, to: 4 });
    expect(result.text).toBe('```\ncode\n```');
    expect(result.text.slice(result.from, result.to)).toBe('code');
  });
});

describe('insertRule', () => {
  it('inserts a horizontal rule and moves the caret past it', () => {
    const result = insertRule('', { from: 0, to: 0 });
    expect(result.text).toBe('---\n');
    expect(result.from).toBe(4);
    expect(result.to).toBe(4);
  });

  it('pads the rule with blank lines inside existing text', () => {
    const result = insertRule('a', { from: 1, to: 1 });
    expect(result.text).toBe('a\n\n---\n');
  });
});

describe('diffChange', () => {
  it('returns null when nothing changed', () => {
    expect(diffChange('same', 'same')).toBeNull();
  });

  it('narrows an edit to the changed span', () => {
    expect(diffChange('abc', 'axc')).toEqual({ from: 1, to: 2, insert: 'x' });
  });

  it('handles pure insertions and deletions', () => {
    expect(diffChange('ac', 'abc')).toEqual({ from: 1, to: 1, insert: 'b' });
    expect(diffChange('abc', 'ac')).toEqual({ from: 1, to: 2, insert: '' });
  });
});
