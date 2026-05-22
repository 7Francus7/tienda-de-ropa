'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { SearchIcon, ChevronRight, UserIcon, PlusIcon } from './Icons';

export default function ClientsScreen({ onClientSelect, onAddNewClient }: {
  onClientSelect: (id: string) => void;
  onAddNewClient: () => void;
}) {
  const { searchClients } = useStore();
  const [query, setQuery] = useState('');
  const filteredClients = searchClients(query);

  return (
    <div className="animate-fade-in app-screen-shell desktop-fixed-screen" style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <div className="ios-nav" style={{ padding: '16px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h1 className="ios-nav-title">Clientes</h1>
          <button className="ios-btn-icon" onClick={onAddNewClient} title="Agregar cliente">
            <PlusIcon size={22} />
          </button>
        </div>
        <div className="ios-search">
          <SearchIcon size={18} />
          <input type="text" placeholder="Buscar por nombre o teléfono..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>

      <div className="screen-content" style={{ flex: 1, overflowY: 'auto', paddingBottom: 'var(--screen-bottom-space, 100px)' }}>
        {filteredClients.length === 0 ? (
          <div className="ios-empty">
            <div className="ios-empty-icon"><UserIcon size={24} /></div>
            <h3>No se encontraron clientes</h3>
            <p>Intentá con otro nombre o agregá un nuevo cliente.</p>
            <button className="ios-btn-text" style={{ marginTop: 12, fontWeight: 600 }} onClick={onAddNewClient}>
              <PlusIcon size={18} /> Agregar Cliente
            </button>
          </div>
        ) : (
          <div className="ios-list-group">
            {filteredClients.map(client => (
              <div key={client.id} className="ios-list-item" onClick={() => onClientSelect(client.id)}>
                <div className="ios-avatar" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 17, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {client.name}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {[client.phone, client.preferredSize ? `T: ${client.preferredSize}` : null].filter(Boolean).join(' · ') || 'Sin datos'}
                  </p>
                </div>
                <ChevronRight size={16} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
