
import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './TopBar';

interface LayoutProps { children: React.ReactNode; }

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Topbar pathname={location.pathname} />
        <div className="content">
          {children}
        </div>
      </div>
    </div>
  );
}