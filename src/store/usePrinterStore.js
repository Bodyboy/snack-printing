// src/store/usePrinterStore.js
import { create } from 'zustand';

export const usePrinterStore = create((set) => ({
  connected: false,
  connecting: false,
  device: null, // { name, address }
  lastError: null,

  setConnecting: (value) => set({ connecting: value }),

  setConnected: (device) =>
    set({ connected: true, connecting: false, device, lastError: null }),

  setDisconnected: () =>
    set({ connected: false, connecting: false, device: null }),

  setError: (error) =>
    set({ connecting: false, lastError: error }),
}));
