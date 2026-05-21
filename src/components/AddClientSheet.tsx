'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { XIcon } from './Icons';

export default function AddClientSheet({ onClose, onClientAdded }: {
  onClose: () => void;
  onClientAdded: (id: string) => void;
}) {
  const { addClient } = useStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredSize, setPreferredSize] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSaving) return;
    setIsSaving(true);
    const client = await addClient({ name: name.trim(), phone: phone.trim() || undefined, preferredSize: preferredSize.trim() || undefined });
    onClientAdded(client.id);
    setIsSaving(false);
  };

  return (
    <div className="ios-sheet-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ios-sheet">
        <div className="ios-sheet-handle" />
        <div className="ios-sheet-header">
          <button className="ios-btn-text" style={{ padding: 0, opacity: 0, pointerEvents: 'none' }}>_</button>
          <h2>Nuevo Cliente</h2>
          <button className="ios-btn-text" style={{ padding: 0 }} onClick={onClose} type="button">
            <XIcon size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '16px' }}>
          <div className="ios-input-group" style={{ marginBottom: 24 }}>
            <div className="ios-input-row">
              <label>Nombre</label>
              <input type="text" placeholder="Ej: Valentina García" value={name} onChange={e => setName(e.target.value)} autoFocus required />
            </div>
            <div className="ios-input-row">
              <label>Teléfono</label>
              <input type="tel" placeholder="Opcional" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="ios-input-row">
              <label>Talle habitual</label>
              <input type="text" placeholder="Ej: M / 42" value={preferredSize} onChange={e => setPreferredSize(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="ios-btn-primary" disabled={!name.trim() || isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Cliente'}
          </button>
        </form>
      </div>
    </div>
  );
}
