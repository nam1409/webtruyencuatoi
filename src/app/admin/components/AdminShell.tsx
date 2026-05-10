"use client";

import React, { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { cn } from "@/lib/utils";
import { AdminShellProvider, useAdminShell } from "../context/AdminShellContext";

function AdminShellContent({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { hideSidebar } = useAdminShell();

  return (
    <div className="flex min-h-screen bg-background dark:bg-zinc-950">
      {/* Sidebar - Desktop & Mobile */}
      {!hideSidebar && (
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0 transition-transform duration-500",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <AdminSidebar />
        </div>
      )}

      {/* Mobile Overlay */}
      {isSidebarOpen && !hideSidebar && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {!hideSidebar && <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} />}
        <main className={cn(
          "flex-1 px-0 md:px-6 lg:px-10",
          !hideSidebar ? "overflow-y-auto" : "overflow-hidden",
          hideSidebar ? "lg:px-0 md:px-0" : ""
        )}>
          <div className={cn(
            "mx-auto py-2 md:py-8",
            hideSidebar ? "max-w-none py-0 md:py-0" : "max-w-[1600px]"
          )}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminShellProvider>
      <AdminShellContent>{children}</AdminShellContent>
    </AdminShellProvider>
  );
}
