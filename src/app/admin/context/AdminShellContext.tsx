"use client";

import React, { createContext, useContext, useState } from "react";

interface AdminShellContextType {
  hideSidebar: boolean;
  setHideSidebar: (hide: boolean) => void;
}

const AdminShellContext = createContext<AdminShellContextType | undefined>(undefined);

export function AdminShellProvider({ children }: { children: React.ReactNode }) {
  const [hideSidebar, setHideSidebar] = useState(false);
  return (
    <AdminShellContext.Provider value={{ hideSidebar, setHideSidebar }}>
      {children}
    </AdminShellContext.Provider>
  );
}

export function useAdminShell() {
  const context = useContext(AdminShellContext);
  if (context === undefined) {
    throw new Error("useAdminShell must be used within an AdminShellProvider");
  }
  return context;
}
