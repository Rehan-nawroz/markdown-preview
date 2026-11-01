export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  const source = `${navigator.platform ?? ''} ${navigator.userAgent ?? ''}`;
  return /mac|iphone|ipad|ipod/i.test(source);
}

export function modKeyLabel(): string {
  return isMac() ? '⌘' : 'Ctrl';
}

export function shortcutLabel(keys: string): string {
  return keys.replace(/Mod\+/g, isMac() ? '⌘' : 'Ctrl+').replace(/Mod/g, isMac() ? '⌘' : 'Ctrl');
}

export function prefersTouch(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

export function prefersFinePointer(): boolean {
  return !prefersTouch();
}
