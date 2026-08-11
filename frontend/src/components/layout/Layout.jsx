import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand-bg text-brand-text-primary">
      {/* Sidebar Nav */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Panel */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* TopBar Header */}
        <TopBar toggleSidebar={toggleSidebar} />

        {/* Scrollable Workspace */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-bg relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
