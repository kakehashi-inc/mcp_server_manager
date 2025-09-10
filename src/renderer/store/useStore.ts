import { create } from 'zustand';
import { MCPServerConfig, ProcessStatus, AppSettings, WSLDistribution, AppConfig } from '../../shared/types';

interface MCPServerWithId {
  id: string;
  config: MCPServerConfig;
}

interface AppState {
  // Config
  config: AppConfig | null;

  // Processes
  servers: MCPServerWithId[];
  processStatuses: Map<string, ProcessStatus>;
  selectedServerId: string | null;

  // WSL
  wslAvailable: boolean;
  wslDistributions: WSLDistribution[];

  // UI State
  loading: boolean;
  error: string | null;

  // Actions
  setConfig: (config: AppConfig) => void;
  setServers: (servers: MCPServerWithId[]) => void;
  addServer: (id: string, config: MCPServerConfig) => void;
  updateServer: (id: string, config: MCPServerConfig) => void;
  removeServer: (id: string) => void;
  setProcessStatus: (id: string, status: ProcessStatus) => void;
  setSelectedServerId: (id: string | null) => void;

  setSettings: (settings: AppSettings) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;

  setWSLAvailable: (available: boolean) => void;
  setWSLDistributions: (distributions: WSLDistribution[]) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Initialize
  initialize: () => Promise<void>;
}

const useStore = create<AppState>((set, get) => ({
  // Initial state
  config: null,
  servers: [],
  processStatuses: new Map(),
  selectedServerId: null,
  wslAvailable: false,
  wslDistributions: [],
  loading: false,
  error: null,

  // Config actions
  setConfig: (config) => {
    const servers = Object.entries(config.mcpServers).map(([id, serverConfig]) => ({
      id,
      config: serverConfig
    }));
    set({ config, servers });
  },

  // Server actions
  setServers: (servers) => set({ servers }),

  addServer: async (id, config) => {
    if (!window.electronAPI?.processAPI) return;
    await window.electronAPI.processAPI.create(id, config);
    const newConfig = await window.electronAPI.configAPI.get();
    get().setConfig(newConfig);
  },

  updateServer: async (id, config) => {
    if (!window.electronAPI?.processAPI) return;
    await window.electronAPI.processAPI.update(id, config);
    const newConfig = await window.electronAPI.configAPI.get();
    get().setConfig(newConfig);
  },

  removeServer: async (id) => {
    if (!window.electronAPI?.processAPI) return;
    await window.electronAPI.processAPI.delete(id);
    const newConfig = await window.electronAPI.configAPI.get();
    get().setConfig(newConfig);
    set((state) => ({
      selectedServerId: state.selectedServerId === id ? null : state.selectedServerId
    }));
  },

  setProcessStatus: (id, status) => set((state) => {
    const newStatuses = new Map(state.processStatuses);
    newStatuses.set(id, status);
    return { processStatuses: newStatuses };
  }),

  setSelectedServerId: (id) => set({ selectedServerId: id }),

  // Settings actions
  setSettings: (settings) => set((state) => ({
    config: state.config ? { ...state.config, settings } : null
  })),

  updateSettings: async (newSettings) => {
    if (!window.electronAPI?.settingsAPI) return;
    const settings = await window.electronAPI.settingsAPI.update(newSettings);
    set((state) => ({
      config: state.config ? { ...state.config, settings } : null
    }));
  },

  // WSL actions
  setWSLAvailable: (available) => set({ wslAvailable: available }),
  setWSLDistributions: (distributions) => set({ wslDistributions: distributions }),

  // UI actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Initialize
  initialize: async () => {
    try {
      set({ loading: true, error: null });

      if (!window.electronAPI) {
        throw new Error('preload failed: window.electronAPI is undefined');
      }

      // Load config
      const config = await window.electronAPI.configAPI.get();
      get().setConfig(config);

      // Load process statuses
      const processes = await window.electronAPI.processAPI.list();
      const statusMap = new Map<string, ProcessStatus>();

      for (const process of processes) {
        const status = await window.electronAPI.processAPI.getStatus(process.id);
        if (status) {
          statusMap.set(process.id, status);
        }
      }
      set({ processStatuses: statusMap });

      // Check WSL
      const wslAvailable = await window.electronAPI.wslAPI.check();
      set({ wslAvailable });

      if (wslAvailable) {
        const distributions = await window.electronAPI.wslAPI.listDistributions();
        set({ wslDistributions: distributions });
      }

      // Set up status update listener
      window.electronAPI.processAPI.onStatusUpdate((id, status) => {
        get().setProcessStatus(id, status);
      });

      set({ loading: false });
    } catch (error) {
      console.error('Failed to initialize:', error);
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize'
      });
    }
  }
}));

export default useStore;
