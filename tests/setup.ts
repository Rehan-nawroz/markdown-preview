import { afterEach } from 'vitest';

/**
 * jsdom does not implement the object-URL API, which `downloadText` uses.
 * Provide inert stubs so export paths can run in tests without touching the DOM.
 */
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = () => 'blob:markform-test';
  URL.revokeObjectURL = () => {};
}

afterEach(() => {
  document.body.innerHTML = '';
});
