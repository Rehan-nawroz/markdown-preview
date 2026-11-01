import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_FILENAME,
  LARGE_FILE_BYTES,
  MAX_FILE_BYTES,
  SAMPLE_FILENAME,
} from '../lib/constants';
import {
  downloadText,
  ensureMarkdownExtension,
  isAcceptedFile,
  readMarkdownFile,
  serializeText,
} from '../lib/file';
import {
  ensureWritePermission,
  hasChangedOnDisk,
  pickFile,
  pickFileWithInput,
  pickSaveHandle,
  supportsFileSystemAccess,
  writeFile,
} from '../lib/file-system-access';
import { createSampleDocument } from '../lib/sample';
import type {
  Cursor,
  DialogState,
  MarkdownDocument,
  SaveResult,
  Tab,
  Toast,
  ToastTone,
} from './types';

type PendingAction = () => void | Promise<void>;

export interface Workspace {
  doc: MarkdownDocument | null;
  tab: Tab;
  dialog: DialogState;
  toasts: Toast[];
  dropActive: boolean;
  cursor: Cursor;
  setTab(tab: Tab): void;
  setCursor(cursor: Cursor): void;
  setSource(source: string): void;
  rename(name: string): void;
  openPicker(): Promise<void>;
  openDropped(file: File, handle: FileSystemFileHandle | null): Promise<void>;
  newDocument(): void;
  loadSample(): void;
  closeDocument(): void;
  save(): Promise<SaveResult>;
  resolveUnsaved(choice: 'save' | 'discard' | 'cancel'): Promise<void>;
  resolveConflict(choice: 'overwrite' | 'reload' | 'cancel'): Promise<void>;
  showShortcuts(): void;
  closeDialog(): void;
  setDropActive(active: boolean): void;
  pushToast(message: string, tone?: ToastTone): void;
  dismissToast(id: number): void;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export function useWorkspace(): Workspace {
  const [doc, setDoc] = useState<MarkdownDocument | null>(null);
  const [tab, setTab] = useState<Tab>('edit');
  const [dialog, setDialog] = useState<DialogState>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dropActive, setDropActive] = useState(false);
  const [cursor, setCursor] = useState<Cursor>({ line: 1, col: 1 });

  const pendingActionRef = useRef<PendingAction | null>(null);
  const toastIdRef = useRef(0);
  const toastTimersRef = useRef(new Map<number, number>());

  const pushToast = (message: string, tone: ToastTone = 'info'): void => {
    const id = ++toastIdRef.current;
    setToasts((current) => [...current, { id, message, tone }].slice(-4));
    const timeout = window.setTimeout(
      () => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
        toastTimersRef.current.delete(id);
      },
      tone === 'error' ? 6000 : 3500,
    );
    toastTimersRef.current.set(id, timeout);
  };

  const dismissToast = (id: number): void => {
    const timer = toastTimersRef.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      toastTimersRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const setSource = (source: string): void => {
    setDoc((current) => {
      if (!current || current.source === source) return current;
      return { ...current, source, dirty: true };
    });
  };

  const rename = (name: string): void => {
    setDoc((current) => {
      if (!current || current.handle) return current;
      const nextName = ensureMarkdownExtension(name);
      if (!nextName || nextName === current.name) return current;
      return { ...current, name: nextName };
    });
  };

  const applyDocument = (
    next: MarkdownDocument,
    message?: string,
    tone: ToastTone = 'success',
  ): void => {
    setDoc(next);
    setTab('edit');
    setCursor({ line: 1, col: 1 });
    setDialog(null);
    if (message) pushToast(message, tone);
  };

  const loadFile = async (file: File, handle: FileSystemFileHandle | null): Promise<void> => {
    if (!isAcceptedFile(file)) {
      pushToast('Unsupported file. Choose a .md, .markdown, or .txt file.', 'error');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      pushToast('That file is larger than the 5 MB limit.', 'error');
      return;
    }

    try {
      const parsed = await readMarkdownFile(file);
      applyDocument(
        {
          name: ensureMarkdownExtension(file.name),
          source: parsed.text,
          handle,
          lastModified: file.lastModified,
          eol: parsed.eol,
          bom: parsed.bom,
          dirty: false,
          hasSaved: false,
          origin: 'file',
        },
        `Opened ${ensureMarkdownExtension(file.name)}`,
      );
      if (file.size > LARGE_FILE_BYTES) {
        pushToast('Large document loaded. Preview may take a moment.', 'info');
      }
    } catch (error) {
      pushToast(`Couldn't read that file. ${errorMessage(error)}`, 'error');
    }
  };

  const createBlankDocument = (): void => {
    applyDocument(
      {
        name: DEFAULT_FILENAME,
        source: '',
        handle: null,
        lastModified: 0,
        eol: '\n',
        bom: false,
        dirty: false,
        hasSaved: false,
        origin: 'new',
      },
      undefined,
    );
  };

  const createSample = (): void => {
    applyDocument({
      name: SAMPLE_FILENAME,
      source: createSampleDocument(import.meta.env.BASE_URL),
      handle: null,
      lastModified: 0,
      eol: '\n',
      bom: false,
      dirty: false,
      hasSaved: false,
      origin: 'sample',
    });
  };

  const guard = (action: PendingAction): void => {
    if (doc?.dirty) {
      pendingActionRef.current = action;
      setDialog({ kind: 'unsaved' });
      return;
    }
    void action();
  };

  const openPicker = async (): Promise<void> => {
    const action: PendingAction = async () => {
      try {
        if (supportsFileSystemAccess()) {
          const picked = await pickFile();
          if (!picked) return;
          await loadFile(picked.file, picked.handle);
          return;
        }

        const file = await pickFileWithInput();
        if (!file) return;
        await loadFile(file, null);
      } catch (error) {
        pushToast(`Couldn't open the file picker. ${errorMessage(error)}`, 'error');
      }
    };

    if (doc?.dirty) {
      pendingActionRef.current = action;
      setDialog({ kind: 'unsaved' });
      return;
    }
    await action();
  };

  const openDropped = async (
    file: File,
    handle: FileSystemFileHandle | null,
  ): Promise<void> => {
    guard(() => loadFile(file, handle));
  };

  const newDocument = (): void => {
    guard(createBlankDocument);
  };

  const loadSample = (): void => {
    guard(createSample);
  };

  const closeDocument = (): void => {
    guard(() => {
      setDoc(null);
      setTab('edit');
      setCursor({ line: 1, col: 1 });
      setDialog(null);
    });
  };

  const save = async (force = false): Promise<SaveResult> => {
    const current = doc;
    if (!current) return 'failed';

    const text = serializeText(current.source, current.eol, current.bom);
    const snapshot = current.source;

    try {
      if (current.handle) {
        const permitted = await ensureWritePermission(current.handle);
        if (!permitted) {
          downloadText(current.name, text);
          setDoc((latest) =>
            latest
              ? {
                  ...latest,
                  dirty: latest.source !== snapshot,
                  hasSaved: true,
                }
              : latest,
          );
          pushToast('Write permission denied. Downloaded a copy instead.', 'error');
          return 'saved';
        }

        if (!force && (await hasChangedOnDisk(current.handle, current.lastModified))) {
          setDialog({ kind: 'conflict' });
          return 'conflict';
        }

        const savedFile = await writeFile(current.handle, text);
        setDoc((latest) =>
          latest
            ? {
                ...latest,
                name: ensureMarkdownExtension(savedFile.name),
                lastModified: savedFile.lastModified,
                dirty: latest.source !== snapshot,
                hasSaved: true,
              }
            : latest,
        );
        pushToast(`Saved ${ensureMarkdownExtension(savedFile.name)}`, 'success');
        return 'saved';
      }

      if (supportsFileSystemAccess()) {
        const handle = await pickSaveHandle(current.name);
        if (!handle) return 'canceled';

        const savedFile = await writeFile(handle, text);
        setDoc((latest) =>
          latest
            ? {
                ...latest,
                name: ensureMarkdownExtension(savedFile.name),
                handle,
                lastModified: savedFile.lastModified,
                dirty: latest.source !== snapshot,
                hasSaved: true,
                origin: 'file',
              }
            : latest,
        );
        pushToast(`Saved ${ensureMarkdownExtension(savedFile.name)}`, 'success');
        return 'saved';
      }

      downloadText(current.name, text);
      setDoc((latest) =>
        latest
          ? {
              ...latest,
              dirty: latest.source !== snapshot,
              hasSaved: true,
            }
          : latest,
      );
      pushToast(`Downloaded a copy of ${current.name}`, 'success');
      return 'saved';
    } catch (error) {
      pushToast(`Couldn't save the document. ${errorMessage(error)}`, 'error');
      return 'failed';
    }
  };

  const resolveUnsaved = async (choice: 'save' | 'discard' | 'cancel'): Promise<void> => {
    if (choice === 'cancel') {
      pendingActionRef.current = null;
      setDialog(null);
      return;
    }

    if (choice === 'discard') {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      setDialog(null);
      await action?.();
      return;
    }

    const result = await save();
    if (result === 'saved') {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      setDialog(null);
      await action?.();
      return;
    }

    if (result === 'conflict') {
      // The conflict dialog replaces the unsaved dialog; keep the pending action.
      return;
    }

    pendingActionRef.current = null;
    setDialog(null);
  };

  const resolveConflict = async (choice: 'overwrite' | 'reload' | 'cancel'): Promise<void> => {
    if (choice === 'cancel') {
      pendingActionRef.current = null;
      setDialog(null);
      return;
    }

    if (choice === 'reload') {
      const handle = doc?.handle;
      if (!handle) {
        pendingActionRef.current = null;
        setDialog(null);
        return;
      }

      try {
        const file = await handle.getFile();
        const parsed = await readMarkdownFile(file);
        const action = pendingActionRef.current;
        pendingActionRef.current = null;
        setDoc((latest) =>
          latest
            ? {
                ...latest,
                name: ensureMarkdownExtension(file.name),
                source: parsed.text,
                lastModified: file.lastModified,
                eol: parsed.eol,
                bom: parsed.bom,
                dirty: false,
                hasSaved: true,
              }
            : latest,
        );
        setCursor({ line: 1, col: 1 });
        setDialog(null);
        pushToast('Reloaded from disk', 'info');
        await action?.();
      } catch (error) {
        setDialog(null);
        pushToast(`Couldn't reload the file. ${errorMessage(error)}`, 'error');
      }
      return;
    }

    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    setDialog(null);
    const result = await save(true);
    if (result === 'saved') {
      await action?.();
    }
  };

  const showShortcuts = (): void => {
    setDialog({ kind: 'shortcuts' });
  };

  const closeDialog = (): void => {
    if (dialog?.kind === 'unsaved') {
      pendingActionRef.current = null;
    }
    setDialog(null);
  };

  useEffect(() => {
    return () => {
      for (const timer of toastTimersRef.current.values()) {
        window.clearTimeout(timer);
      }
      toastTimersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!doc?.dirty) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [doc?.dirty]);

  return {
    doc,
    tab,
    dialog,
    toasts,
    dropActive,
    cursor,
    setTab,
    setCursor,
    setSource,
    rename,
    openPicker,
    openDropped,
    newDocument,
    loadSample,
    closeDocument,
    save,
    resolveUnsaved,
    resolveConflict,
    showShortcuts,
    closeDialog,
    setDropActive,
    pushToast,
    dismissToast,
  };
}
