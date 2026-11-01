import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

export const markformHighlightStyle = HighlightStyle.define([
  { tag: tags.heading1, color: '#FAFAFA', fontWeight: '700', fontSize: '15px' },
  { tag: tags.heading2, color: '#FAFAFA', fontWeight: '600', fontSize: '14px' },
  { tag: tags.heading3, color: '#FAFAFA', fontWeight: '600' },
  { tag: tags.heading4, color: '#FAFAFA', fontWeight: '600' },
  { tag: tags.heading5, color: '#FAFAFA', fontWeight: '600' },
  { tag: tags.heading6, color: '#FAFAFA', fontWeight: '600' },
  { tag: tags.processingInstruction, color: '#38BDF8', fontWeight: '600' },
  { tag: tags.contentSeparator, color: '#525252' },
  { tag: tags.strong, color: '#FAFAFA', fontWeight: '700' },
  { tag: tags.emphasis, color: '#E5E5E5', fontStyle: 'italic' },
  { tag: tags.strikethrough, color: '#737373', textDecoration: 'line-through' },
  { tag: tags.link, color: '#38BDF8' },
  { tag: tags.url, color: '#A3A3A3', textDecoration: 'underline' },
  { tag: tags.monospace, color: '#F3E4C9' },
  { tag: tags.quote, color: '#E5E5E5', fontStyle: 'italic' },
  { tag: tags.list, color: '#737373' },
  { tag: tags.meta, color: '#71717A' },
  { tag: tags.escape, color: '#FBBF24' },
  { tag: tags.labelName, color: '#FBBF24' },
  { tag: tags.keyword, color: '#C084FC', fontWeight: '600' },
  { tag: tags.controlKeyword, color: '#C084FC', fontWeight: '600' },
  { tag: tags.operatorKeyword, color: '#C084FC', fontWeight: '600' },
  { tag: tags.function(tags.variableName), color: '#38BDF8' },
  { tag: tags.definition(tags.variableName), color: '#38BDF8' },
  { tag: tags.string, color: '#34D399' },
  { tag: tags.regexp, color: '#34D399' },
  { tag: tags.number, color: '#FBBF24' },
  { tag: tags.bool, color: '#FBBF24' },
  { tag: tags.null, color: '#FBBF24' },
  { tag: tags.comment, color: '#71717A', fontStyle: 'italic' },
  { tag: tags.operator, color: '#737373' },
  { tag: tags.punctuation, color: '#737373' },
  { tag: tags.bracket, color: '#737373' },
  { tag: tags.tagName, color: '#C084FC' },
  { tag: tags.attributeName, color: '#F6BB84' },
  { tag: tags.attributeValue, color: '#34D399' },
  { tag: tags.propertyName, color: '#38BDF8' },
  { tag: tags.typeName, color: '#7DD3FC' },
  { tag: tags.className, color: '#7DD3FC' },
  { tag: tags.invalid, color: '#F87171' },
]);

export const markformEditorTheme = EditorView.theme(
  {
    '&': {
      height: '100%',
      backgroundColor: 'transparent',
      color: '#E5E5E5',
      fontSize: '14px',
    },
    '.cm-scroller': {
      fontFamily: 'var(--font-mono)',
      lineHeight: '26px',
    },
    '.cm-content': {
      padding: '0 24px 0 8px',
      caretColor: '#34D399',
    },
    '.cm-line': {
      padding: '0',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      color: '#525252',
      border: 'none',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(255, 255, 255, 0.022)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
      color: '#8E8E93',
    },
    '.cm-selectionBackground, ::selection': {
      backgroundColor: '#2B2B2B !important',
    },
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: '#2B2B2B !important',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#34D399',
    },
    '.cm-placeholder': {
      color: '#525252',
    },
    '.cm-panels': {
      backgroundColor: '#0D0D0D',
      color: '#D4D4D8',
    },
    '.cm-tooltip': {
      backgroundColor: '#121212',
      border: '1px solid #262626',
    },
  },
  { dark: true },
);

export const markformSyntax = syntaxHighlighting(markformHighlightStyle);
