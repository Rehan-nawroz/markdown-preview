import type {
  DroppableDataTransferItem,
  FilePickerWindow,
  PermissionCapableHandle,
} from '../types/file-system-access';
import { ACCEPT_ATTRIBUTE, ensureMarkdownExtension } from './file';
import { isAbortError } from './file';

const MARKDOWN_PICKER_TYPES = [
  {
    description: 'Markdown documents',
    accept: {
      'text/markdown': ['.md', '.markdown'],
      'text/plain': ['.txt'],
    },
  },
];

function pickerWindow(): FilePickerWindow {
  return window as FilePickerWindow;
}

export function supportsFileSystemAccess(): boolean {
  return typeof pickerWindow().showOpenFilePicker === 'function';
}

export async function pickFile(): Promise<{ file: File; handle: FileSystemFileHandle } | null> {
  const picker = pickerWindow().showOpenFilePicker;
  if (!picker) return null;

  try {
    const [handle] = await picker({
      multiple: false,
      excludeAcceptAllOption: false,
      types: MARKDOWN_PICKER_TYPES,
    });
    if (!handle) return null;
    return { file: await handle.getFile(), handle };
  } catch (error) {
    if (isAbortError(error)) return null;
    throw error;
  }
}

export function pickFileWithInput(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ACCEPT_ATTRIBUTE;
    input.style.display = 'none';
    document.body.appendChild(input);

    let settled = false;
    const finish = (file: File | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(file);
    };

    input.addEventListener('change', () => finish(input.files?.[0] ?? null), { once: true });
    input.addEventListener('cancel', () => finish(null), { once: true });
    input.click();
  });
}

export async function pickSaveHandle(
  suggestedName: string,
): Promise<FileSystemFileHandle | null> {
  const picker = pickerWindow().showSaveFilePicker;
  if (!picker) return null;

  try {
    return await picker({
      suggestedName: ensureMarkdownExtension(suggestedName),
      excludeAcceptAllOption: false,
      types: MARKDOWN_PICKER_TYPES,
    });
  } catch (error) {
    if (isAbortError(error)) return null;
    throw error;
  }
}

export async function writeFile(handle: FileSystemFileHandle, text: string): Promise<File> {
  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
  return handle.getFile();
}

export async function ensureWritePermission(handle: FileSystemFileHandle): Promise<boolean> {
  const capable = handle as PermissionCapableHandle;
  if (typeof capable.queryPermission !== 'function') return true;

  const descriptor = { mode: 'readwrite' as const };
  if ((await capable.queryPermission(descriptor)) === 'granted') return true;
  if (typeof capable.requestPermission !== 'function') return false;
  return (await capable.requestPermission(descriptor)) === 'granted';
}

export async function getDroppedHandle(
  item: DataTransferItem,
): Promise<FileSystemFileHandle | null> {
  const droppable = item as DroppableDataTransferItem;
  if (typeof droppable.getAsFileSystemHandle !== 'function') return null;

  try {
    const handle = await droppable.getAsFileSystemHandle();
    return handle?.kind === 'file' ? (handle as FileSystemFileHandle) : null;
  } catch {
    return null;
  }
}

export async function hasChangedOnDisk(
  handle: FileSystemFileHandle,
  lastModified: number,
): Promise<boolean> {
  if (!lastModified) return false;
  const file = await handle.getFile();
  return file.lastModified > lastModified + 1000;
}
