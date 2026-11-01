export const APP_NAME = 'Markform';
export const APP_VERSION = '1.0.0';

export const ACCEPTED_EXTENSIONS = ['.md', '.markdown', '.txt'] as const;
export const ACCEPTED_MIME_TYPES = ['text/markdown', 'text/plain', 'text/x-markdown'] as const;
export const ACCEPT_ATTRIBUTE = '.md,.markdown,.txt,text/markdown,text/plain';

export const DEFAULT_FILENAME = 'untitled.md';
export const SAMPLE_FILENAME = 'welcome.md';

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const LARGE_FILE_BYTES = 1.5 * 1024 * 1024;
