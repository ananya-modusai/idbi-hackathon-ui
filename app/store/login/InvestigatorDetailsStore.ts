import { create } from 'zustand';

interface InvestigatorDetailsStore {
  investigatorEmail: string;
  setInvestigatorEmail: (investigatorEmail: string) => void;
}

export const useInvestigatorDetailsStore = create<InvestigatorDetailsStore>((set) => ({
  investigatorEmail: "pankaj@gmail.com",
  setInvestigatorEmail: (investigatorEmail) => set({ investigatorEmail }),
}));
