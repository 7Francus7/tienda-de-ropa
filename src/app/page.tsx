'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import TabBar from '@/components/TabBar';
import HomeScreen from '@/components/HomeScreen';
import ClientsScreen from '@/components/ClientsScreen';
import HistoryScreen from '@/components/HistoryScreen';
import AddSaleScreen from '@/components/AddSaleScreen';
import PurchaseScreen from '@/components/PurchaseScreen';
import ClientProfile from '@/components/ClientProfile';
import AddClientSheet from '@/components/AddClientSheet';
import DashboardScreen from '@/components/DashboardScreen';
import InventoryScreen from '@/components/InventoryScreen';
import ExpensesScreen from '@/components/ExpensesScreen';

import { Suspense } from 'react';

type Tab = 'home' | 'clients' | 'add' | 'history' | 'dashboard';
type SubScreen = 'inventory' | 'expenses' | 'purchases' | null;

function AppContent() {
  const searchParams = useSearchParams();
  const initialAction = searchParams.get('action');
  const [activeTab, setActiveTab] = useState<Tab>(initialAction === 'new_client' ? 'clients' : 'home');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showAddClient, setShowAddClient] = useState(initialAction === 'new_client');
  const [isAddingSale, setIsAddingSale] = useState(initialAction === 'new_record');
  const [currentSubScreen, setCurrentSubScreen] = useState<SubScreen>(null);
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'pendiente' | 'pagado' | 'parcial'>('all');

  useEffect(() => {
    const action = searchParams.get('action');
    queueMicrotask(() => {
      if (action === 'new_record') {
        setIsAddingSale(true);
      } else if (action === 'new_client') {
        setActiveTab('clients');
        setShowAddClient(true);
      }
    });
  }, [searchParams]);

  const goToDebtors = () => {
    setHistoryStatusFilter('pendiente');
    setActiveTab('history');
  };

  if (selectedClientId) {
    return <ClientProfile clientId={selectedClientId} onBack={() => setSelectedClientId(null)} />;
  }

  if (currentSubScreen === 'inventory') {
    return <InventoryScreen onBack={() => setCurrentSubScreen(null)} />;
  }

  if (currentSubScreen === 'expenses') {
    return <ExpensesScreen onBack={() => setCurrentSubScreen(null)} />;
  }

  if (currentSubScreen === 'purchases') {
    return <PurchaseScreen onBack={() => setCurrentSubScreen(null)} />;
  }

  if (isAddingSale || activeTab === 'add') {
    return (
      <AddSaleScreen
        onBack={() => {
          setIsAddingSale(false);
          if (activeTab === 'add') setActiveTab('home');
        }}
      />
    );
  }

  return (
    <>
      {activeTab === 'home' && (
        <HomeScreen
          onGoToClients={() => setActiveTab('clients')}
          onGoToAdd={() => setIsAddingSale(true)}
          onGoToHistory={() => setActiveTab('history')}
          onClientSelect={setSelectedClientId}
          onGoToInventory={() => setCurrentSubScreen('inventory')}
        />
      )}

      {activeTab === 'clients' && (
        <ClientsScreen
          onClientSelect={setSelectedClientId}
          onAddNewClient={() => setShowAddClient(true)}
        />
      )}

      {activeTab === 'history' && (
        <HistoryScreen
          onClientSelect={setSelectedClientId}
          initialStatusFilter={historyStatusFilter}
        />
      )}

      {activeTab === 'dashboard' && (
        <DashboardScreen
          onGoToInventory={() => setCurrentSubScreen('inventory')}
          onGoToExpenses={() => setCurrentSubScreen('expenses')}
          onGoToPurchases={() => setCurrentSubScreen('purchases')}
          onGoToDebtors={goToDebtors}
          onClientSelect={setSelectedClientId}
        />
      )}

      {showAddClient && (
        <AddClientSheet
          onClose={() => setShowAddClient(false)}
          onClientAdded={id => {
            setShowAddClient(false);
            setSelectedClientId(id);
          }}
        />
      )}

      <TabBar
        activeTab={activeTab}
        onTabChange={tab => {
          if (tab === 'add') {
            setIsAddingSale(true);
          } else {
            if (tab === 'history') setHistoryStatusFilter('all');
            setActiveTab(tab);
            setSelectedClientId(null);
            setIsAddingSale(false);
            setCurrentSubScreen(null);
          }
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando...</div>}>
      <AppContent />
    </Suspense>
  );
}
