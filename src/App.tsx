import { useEffect, useRef } from 'react';
import StartScreen from './screens/StartScreen';
import DocumentScreen from './screens/DocumentScreen';
import UnsavedDialog from './components/UnsavedDialog';
import ConflictDialog from './components/ConflictDialog';
import ShortcutsDialog from './components/ShortcutsDialog';
import DropOverlay from './components/DropOverlay';
import ToastStack from './components/ToastStack';
import { APP_VERSION } from './lib/constants';
import { copyText } from './lib/clipboard';
import { createStandaloneHtml } from './lib/export-html';
import { downloadText, stripExtension } from './lib/file';
import { getDroppedHandle } from './lib/file-system-access';
import { renderMarkdown } from './lib/markdown';
import { isMac } from './lib/platform';
import { useWorkspace } from './state/useWorkspace';

export default function App() {
  const workspace = useWorkspace();
  const workspaceRef = useRef(workspace);
  const dragDepthRef = useRef(0);

  useEffect(() => {
    workspaceRef.current = workspace;
  });

  useEffect(() => {
    const hasFiles = (event: DragEvent) =>
      Array.from(event.dataTransfer?.types ?? []).includes('Files');

    const handleDragEnter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepthRef.current += 1;
      workspaceRef.current.setDropActive(true);
    };

    const handleDragOver = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    };

    const handleDragLeave = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) workspaceRef.current.setDropActive(false);
    };

    const handleDrop = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepthRef.current = 0;

      const current = workspaceRef.current;
      current.setDropActive(false);

      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) return;
      if (files.length > 1) {
        current.pushToast('One file at a time — opening the first.', 'info');
      }

      const item = Array.from(event.dataTransfer?.items ?? []).find(
        (entry) => entry.kind === 'file',
      );

      void (async () => {
        const handle = item ? await getDroppedHandle(item) : null;
        await current.openDropped(files[0], handle);
      })();
    };

    const handleDragEnd = () => {
      dragDepthRef.current = 0;
      workspaceRef.current.setDropActive(false);
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);
    window.addEventListener('dragend', handleDragEnd);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
      window.removeEventListener('dragend', handleDragEnd);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;

      const target = event.target as HTMLElement | null;
      const isField = Boolean(
        target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable),
      );
      const current = workspaceRef.current;

      if (event.key === '?') {
        if (isField || current.dialog) return;
        event.preventDefault();
        current.showShortcuts();
        return;
      }

      if (current.dialog) return;

      const mod = isMac() ? event.metaKey : event.ctrlKey;
      if (!mod) return;

      const key = event.key.toLowerCase();
      if (key === 's') {
        event.preventDefault();
        void current.save();
      } else if (key === 'o') {
        event.preventDefault();
        void current.openPicker();
      } else if (key === 'n') {
        event.preventDefault();
        current.newDocument();
      } else if (key === 'e' && current.doc) {
        event.preventDefault();
        current.setTab(current.tab === 'edit' ? 'preview' : 'edit');
      } else if (key === 'w' && current.doc) {
        event.preventDefault();
        current.closeDocument();
      } else if (key === 'p' && current.doc) {
        event.preventDefault();
        current.setTab('preview');
        window.setTimeout(() => window.print(), 160);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const exportHtml = () => {
    if (!workspace.doc) return;
    const html = createStandaloneHtml(workspace.doc.source, workspace.doc.name);
    downloadText(`${stripExtension(workspace.doc.name)}.html`, html, 'text/html;charset=utf-8');
    workspace.pushToast('Exported a standalone HTML file.', 'success');
  };

  const printDocument = () => {
    if (!workspace.doc) return;
    workspace.setTab('preview');
    window.setTimeout(() => window.print(), 160);
  };

  const copyHtml = async () => {
    if (!workspace.doc) return;
    const ok = await copyText(renderMarkdown(workspace.doc.source));
    workspace.pushToast(
      ok ? 'HTML copied to the clipboard.' : "Couldn't copy HTML.",
      ok ? 'success' : 'error',
    );
  };

  const copyCode = async (code: string) => {
    const ok = await copyText(code);
    workspace.pushToast(
      ok ? 'Code copied to the clipboard.' : "Couldn't copy the code.",
      ok ? 'success' : 'error',
    );
  };

  return (
    <div className="app-root">
      {workspace.doc ? (
        <DocumentScreen
          workspace={workspace}
          onExportHtml={exportHtml}
          onPrint={printDocument}
          onCopyHtml={() => void copyHtml()}
          onCopyCode={(code) => void copyCode(code)}
        />
      ) : (
        <StartScreen
          version={APP_VERSION}
          onOpen={() => void workspace.openPicker()}
          onNew={workspace.newDocument}
          onSample={workspace.loadSample}
          onHelp={workspace.showShortcuts}
        />
      )}

      {workspace.dialog?.kind === 'unsaved' && workspace.doc ? (
        <UnsavedDialog
          name={workspace.doc.name}
          onChoose={(choice) => void workspace.resolveUnsaved(choice)}
        />
      ) : null}

      {workspace.dialog?.kind === 'conflict' ? (
        <ConflictDialog onChoose={(choice) => void workspace.resolveConflict(choice)} />
      ) : null}

      {workspace.dialog?.kind === 'shortcuts' ? (
        <ShortcutsDialog onClose={workspace.closeDialog} />
      ) : null}

      {workspace.dropActive ? <DropOverlay /> : null}

      <ToastStack toasts={workspace.toasts} onDismiss={workspace.dismissToast} />
    </div>
  );
}
