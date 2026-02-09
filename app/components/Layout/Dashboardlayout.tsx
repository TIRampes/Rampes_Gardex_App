"use client";

import { useState, useCallback } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleOpenSidebar = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />

      {/* Header */}
      <Header onMenuClick={handleOpenSidebar} />

      {/* Main Content */}
      <main className="pt-16 lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}