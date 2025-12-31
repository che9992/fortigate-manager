import { create } from 'zustand';
import type { FortigateServer } from '@/types';
import { storage } from './storage';

interface AppState {
  servers: FortigateServer[];
  selectedServers: string[];
  loadServers: () => void;
  addServer: (server: FortigateServer) => void;
  updateServer: (id: string, updates: Partial<FortigateServer>) => void;
  deleteServer: (id: string) => void;
  toggleServerSelection: (id: string) => void;
  selectAllServers: () => void;
  clearServerSelection: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  servers: [],
  selectedServers: [],

  loadServers: () => {
    const servers = storage.getServers();
    set({
      servers,
      selectedServers: servers.filter(s => s.enabled).map(s => s.id),
    });
  },

  addServer: (server) => {
    storage.addServer(server);
    set({ servers: storage.getServers() });
  },

  updateServer: (id, updates) => {
    storage.updateServer(id, updates);
    set({ servers: storage.getServers() });
  },

  deleteServer: (id) => {
    storage.deleteServer(id);
    const { selectedServers } = get();
    set({
      servers: storage.getServers(),
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
