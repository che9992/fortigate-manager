import { create } from 'zustand';
import type { FortigateServer } from '@/types';
import { storage } from './storage';

interface AppState {
  servers: FortigateServer[];
  selectedServers: string[];
  loadServers: () => Promise<void>;
  addServer: (server: FortigateServer) => Promise<void>;
  updateServer: (id: string, updates: Partial<FortigateServer>) => Promise<void>;
  deleteServer: (id: string) => Promise<void>;
  toggleServerSelection: (id: string) => void;
  selectAllServers: () => void;
  clearServerSelection: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  servers: [],
  selectedServers: [],

  loadServers: async () => {
    const servers = await storage.getServers();
    set({
      servers,
      selectedServers: servers.filter(s => s.enabled).map(s => s.id),
    });
  },

  addServer: async (server) => {
    await storage.addServer(server);
    const servers = await storage.getServers();
    set({ servers });
  },

  updateServer: async (id, updates) => {
    await storage.updateServer(id, updates);
    const servers = await storage.getServers();
    set({ servers });
  },

  deleteServer: async (id) => {
    await storage.deleteServer(id);
    const { selectedServers } = get();
    const servers = await storage.getServers();
    set({
      servers,
      selectedServers: selectedServers.filter(sid => sid !== id),
    });
  },

  toggleServerSelection: (id) => {
    const { selectedServers } = get();
    const newSelection = selectedServers.includes(id)
      ? selectedServers.filter(sid => sid !== id)
      : [...selectedServers, id];
    set({ selectedServers: newSelection });
  },

  selectAllServers: () => {
    const { servers } = get();
    set({ selectedServers: servers.map(s => s.id) });
  },

  clearServerSelection: () => {
    set({ selectedServers: [] });
  },
}));
