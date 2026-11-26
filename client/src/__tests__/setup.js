import { vi } from 'vitest';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
Object.defineProperty(window, 'matchMedia', { writable: true, value: (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }) });
window.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();
globalThis.IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
URL.createObjectURL = vi.fn(() => 'blob:x');
globalThis.Image = class MockImage {
  width = 0;
  height = 0;
  set src(_value) { queueMicrotask(() => this.onerror?.(new Error('Image loading is unavailable in jsdom'))); }
};
