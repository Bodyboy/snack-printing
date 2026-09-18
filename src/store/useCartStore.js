// src/store/useCartStore.js
import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  lines: [], // { id, name, price, qty }

  addItem: (item) => {
    const lines = get().lines;
    const existing = lines.find((l) => l.id === item.id);
    if (existing) {
      set({
        lines: lines.map((l) =>
          l.id === item.id ? { ...l, qty: l.qty + 1 } : l
        ),
      });
    } else {
      set({ lines: [...lines, { ...item, qty: 1 }] });
    }
  },

  removeLine: (id) => {
    set({ lines: get().lines.filter((l) => l.id !== id) });
  },

  decrementLine: (id) => {
    const lines = get().lines;
    const existing = lines.find((l) => l.id === id);
    if (!existing) return;
    if (existing.qty <= 1) {
      set({ lines: lines.filter((l) => l.id !== id) });
    } else {
      set({
        lines: lines.map((l) => (l.id === id ? { ...l, qty: l.qty - 1 } : l)),
      });
    }
  },

  clearCart: () => set({ lines: [] }),

  getTotal: () => get().lines.reduce((sum, l) => sum + l.qty * l.price, 0),
}));
