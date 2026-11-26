import { vi } from 'vitest';
Object.defineProperty(window, 'matchMedia', { writable: true, value: (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }) });
window.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();
globalThis.IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
URL.createObjectURL = vi.fn(() => 'blob:x');
