import { create } from 'zustand';

interface TestingStore {
    mymail: string;
    setMymail: (mymail: string) => void;
}

export const useTestingStore = create<TestingStore>((set) => ({
    mymail: 'pankaj@modussecure.com',
    setMymail: (mymail: string) => set({ mymail })
}))

