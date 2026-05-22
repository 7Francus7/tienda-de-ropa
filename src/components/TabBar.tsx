'use client';

import React from 'react';
import { HomeIcon, UsersIcon, PlusIcon, ClockIcon, ChartIcon, PackageIcon } from './Icons';
import { hapticFeedback } from '@/utils/haptics';

type TabType = 'home' | 'clients' | 'add' | 'inventory' | 'history' | 'dashboard';

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const tabs = [
    { id: 'home' as const, label: 'Inicio', icon: HomeIcon },
    { id: 'clients' as const, label: 'Clientes', icon: UsersIcon },
    { id: 'add' as const, label: 'Venta', icon: PlusIcon },
    { id: 'inventory' as const, label: 'Stock', icon: PackageIcon },
    { id: 'history' as const, label: 'Historial', icon: ClockIcon },
    { id: 'dashboard' as const, label: 'Balance', icon: ChartIcon },
  ];

  return (
    <nav className="ios-tab-bar" id="main-tab-bar">
      <div className="desktop-nav-brand">
        <div className="desktop-nav-brand-icon">T</div>
        <div>
          <p className="desktop-nav-eyebrow">Sistema comercial</p>
          <h2 className="desktop-nav-title">Tienda</h2>
        </div>
      </div>

      <div className="desktop-nav-links">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`ios-tab-btn ${activeTab === tab.id ? 'active' : ''} ${tab.id === 'add' ? 'desktop-nav-cta' : ''}`}
          onClick={() => { hapticFeedback('light'); onTabChange(tab.id); }}
          id={`tab-${tab.id}`}
        >
          <tab.icon size={24} />
          <span>{tab.label}</span>
        </button>
      ))}
      </div>

      <div className="desktop-nav-footer">
        <p className="desktop-nav-footer-title">Operación diaria</p>
        <p className="desktop-nav-footer-copy">Clientes, ventas, historial y balance en un solo lugar.</p>
      </div>
    </nav>
  );
}
