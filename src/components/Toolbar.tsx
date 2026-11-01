import type { ReactNode, RefObject } from 'react';
import type { EditorView } from '@codemirror/view';
import {
  Braces,
  Image as ImageIcon,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  SquareCheck,
  Table as TableIcon,
} from 'lucide-react';
import {
  bold,
  bulletList,
  codeBlock,
  heading,
  image,
  inlineCode,
  italic,
  link,
  orderedList,
  quote,
  rule,
  strike,
  table,
  taskList,
  type EditorCommand,
} from '../editor/commands';
import { shortcutLabel } from '../lib/platform';

interface ToolbarProps {
  editorRef: RefObject<EditorView | null>;
}

interface ToolButtonProps {
  label: string;
  shortcut?: string;
  onClick(): void;
  children: ReactNode;
}

function ToolButton({ label, shortcut, onClick, children }: ToolButtonProps) {
  return (
    <button
      type="button"
      className="toolbar__button"
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function Toolbar({ editorRef }: ToolbarProps) {
  const run = (command: EditorCommand) => {
    const view = editorRef.current;
    if (view) command(view);
  };

  return (
    <div className="toolbar-wrap">
      <div className="toolbar" role="toolbar" aria-label="Markdown formatting">
        <div className="toolbar__group" role="group" aria-label="Inline formatting">
          <ToolButton label="Bold" shortcut={shortcutLabel('Mod+B')} onClick={() => run(bold)}>
            <span className="toolbar__glyph">B</span>
          </ToolButton>
          <ToolButton label="Italic" shortcut={shortcutLabel('Mod+I')} onClick={() => run(italic)}>
            <span className="toolbar__glyph toolbar__glyph--italic">I</span>
          </ToolButton>
          <ToolButton label="Strikethrough" onClick={() => run(strike)}>
            <span className="toolbar__glyph toolbar__glyph--strike">S</span>
          </ToolButton>
          <ToolButton label="Inline code" onClick={() => run(inlineCode)}>
            <span className="toolbar__glyph toolbar__glyph--code">&lt;/&gt;</span>
          </ToolButton>
        </div>

        <span className="toolbar__divider" aria-hidden="true" />

        <div className="toolbar__group" role="group" aria-label="Block formatting">
          <ToolButton
            label="Heading"
            shortcut="H1 → H2 → H3"
            onClick={() => run(heading)}
          >
            <span className="toolbar__glyph toolbar__glyph--heading">H</span>
          </ToolButton>
          <ToolButton label="Blockquote" onClick={() => run(quote)}>
            <Quote strokeWidth={1.8} aria-hidden="true" />
          </ToolButton>
          <ToolButton label="Code block" onClick={() => run(codeBlock)}>
            <Braces strokeWidth={1.8} aria-hidden="true" />
          </ToolButton>
        </div>

        <span className="toolbar__divider" aria-hidden="true" />

        <div className="toolbar__group" role="group" aria-label="Lists">
          <ToolButton label="Bulleted list" onClick={() => run(bulletList)}>
            <List strokeWidth={1.8} aria-hidden="true" />
          </ToolButton>
          <ToolButton label="Numbered list" onClick={() => run(orderedList)}>
            <ListOrdered strokeWidth={1.8} aria-hidden="true" />
          </ToolButton>
          <ToolButton label="Task list" onClick={() => run(taskList)}>
            <SquareCheck strokeWidth={1.8} aria-hidden="true" />
          </ToolButton>
        </div>

        <span className="toolbar__divider" aria-hidden="true" />

        <div className="toolbar__group" role="group" aria-label="Insert">
          <ToolButton label="Insert link" shortcut={shortcutLabel('Mod+K')} onClick={() => run(link)}>
            <LinkIcon strokeWidth={1.8} aria-hidden="true" />
          </ToolButton>
          <ToolButton label="Insert image" onClick={() => run(image)}>
            <ImageIcon strokeWidth={1.8} aria-hidden="true" />
          </ToolButton>
          <ToolButton label="Insert table" onClick={() => run(table)}>
            <TableIcon strokeWidth={1.8} aria-hidden="true" />
          </ToolButton>
          <ToolButton label="Horizontal rule" onClick={() => run(rule)}>
            <Minus strokeWidth={1.8} aria-hidden="true" />
          </ToolButton>
        </div>

        <span className="toolbar__label" aria-hidden="true">
          Markdown
        </span>
      </div>
    </div>
  );
}
