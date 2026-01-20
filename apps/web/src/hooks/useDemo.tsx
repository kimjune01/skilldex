import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DemoContextValue {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  setDemoMode: (enabled: boolean) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

const DEMO_STORAGE_KEY = 'skilldex_demo_mode';

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    // Check localStorage on initial load
    const stored = localStorage.getItem(DEMO_STORAGE_KEY);
    return stored === 'true';
  });

  useEffect(() => {
    // Persist to localStorage
    localStorage.setItem(DEMO_STORAGE_KEY, isDemoMode ? 'true' : 'false');
  }, [isDemoMode]);

  const toggleDemoMode = () => setIsDemoMode((prev) => !prev);
  const setDemoMode = (enabled: boolean) => setIsDemoMode(enabled);

  return (
    <DemoContext.Provider value={{ isDemoMode, toggleDemoMode, setDemoMode }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
