import { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem('raaed_sidebar_collapsed');
    return stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem('raaed_sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  const toggle = () => setCollapsed(c => !c);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}

export default SidebarContext;
