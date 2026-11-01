import { useEffect, useMemo, useRef } from 'react';
import type { EditorView } from '@codemirror/view';
import DocumentHeader from '../components/DocumentHeader';
import StatusBar from '../components/StatusBar';
import { renderMarkdown } from '../lib/markdown';
import type { Workspace } from '../state/useWorkspace';
import EditorScreen from './EditorScreen';
import PreviewScreen from './PreviewScreen';

interface DocumentScreenProps {
  workspace: Workspace;
  onExportHtml(): void;
  onPrint(): void;
  onCopyHtml(): void;
  onCopyCode(text: string): void;
}

export default function DocumentScreen({
  workspace,
  onExportHtml,
  onPrint,
  onCopyHtml,
  onCopyCode,
}: DocumentScreenProps) {
  const { doc, tab } = workspace;
  const editorRef = useRef<EditorView | null>(null);
  const previewScrollRef = useRef(0);

  const previewHtml = useMemo(
    () => (tab === 'preview' && doc ? renderMarkdown(doc.source) : ''),
    [tab, doc],
  );

  useEffect(() => {
    if (tab !== 'edit') return;
    const frame = window.requestAnimationFrame(() => editorRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [tab]);

  if (!doc) return null;

  return (
    <div className="doc-shell">
      <DocumentHeader
        doc={doc}
        tab={tab}
        onTabChange={workspace.setTab}
        onOpen={() => void workspace.openPicker()}
        onSave={() => void workspace.save()}
        onNew={workspace.newDocument}
        onClose={workspace.closeDocument}
        onRename={workspace.rename}
        onExportHtml={onExportHtml}
        onPrint={onPrint}
        onCopyHtml={onCopyHtml}
        onHelp={workspace.showShortcuts}
      />

      <div className="doc-body">
        <EditorScreen
          hidden={tab !== 'edit'}
          value={doc.source}
          onChange={workspace.setSource}
          onCursor={workspace.setCursor}
          onSave={() => void workspace.save()}
          editorRef={editorRef}
        />

        {tab === 'preview' ? (
          <PreviewScreen
            html={previewHtml}
            source={doc.source}
            scrollRef={previewScrollRef}
            onEdit={() => workspace.setTab('edit')}
            onCopyCode={onCopyCode}
          />
        ) : null}
      </div>

      <StatusBar mode={tab} doc={doc} cursor={workspace.cursor} />
    </div>
  );
}
