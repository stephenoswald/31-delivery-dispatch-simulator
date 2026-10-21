import { vi } from 'vitest';
Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
  value: function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  },
});
Object.defineProperty(HTMLDialogElement.prototype, 'close', {
  value: function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  },
});
// Leaflet rendering is exercised in a real browser. Unit tests focus on flows.
vi.mock('../components/maps/DispatchMap', () => ({ DispatchMap: () => null }));
