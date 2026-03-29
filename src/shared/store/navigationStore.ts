import { create } from 'zustand';

export type NavigationTab = 'home' | 'stats' | 'settings';

interface NavigationStore {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  activeTab: 'home',
  
  setActiveTab: (tab: NavigationTab) => {
    set({ activeTab: tab });
  },
}));
