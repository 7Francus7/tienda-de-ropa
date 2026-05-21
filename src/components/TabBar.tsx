'use client';

import React from 'react';
import { HomeIcon, UsersIcon, PlusIcon, ClockIcon, ChartIcon } from './Icons';
import { hapticFeedback } from '@/utils/haptics';

type TabType = 'home' | 'clients' | 'add' | 'history' | 'dashboard';

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const tabs = [
    { id: 'home' as const, label: 'Inicio', icon: HomeIcon },
    { id: 'clients' as const, label: 'Clientes', icon: UsersIcon },
    { id: 'add' as const, label: 'Venta', icon: PlusIcon },
    { id: 'history' as const, label: 'Historial', icon: ClockIcon },
    { id: 'dashboard' as const, label: 'Balance', icon: ChartIcon },
  ];

  return (
    <nav className="ios-tab-bar" id="main-tab-bar">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`ios-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => { hapticFeedback('light'); onTabChange(tab.id); }}
          id={`tab-${tab.id}`}
        >
          <tab.icon size={24} />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
