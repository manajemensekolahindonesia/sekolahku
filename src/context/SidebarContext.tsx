import { createContext, useContext, useState, type ReactNode } from "react";

interface SidebarContextType {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType>({ collapsed: false, toggle: () => {} });

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar_collapsed") === "true";
    } catch { return false; }
  });

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem("sidebar_collapsed", String(next)); } catch {}
      return next;
    });
  };

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
