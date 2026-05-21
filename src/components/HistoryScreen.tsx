'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/store/StoreContext';
import { ShirtIcon, ClockIcon } from './Icons';
import { exportSalesToXlsx } from '@/utils/exportXlsx';

export default function HistoryScreen({
  onClientSelect,
  initialStatusFilter,
}: {
  onClientSelect: (id: string) => void;
  initialStatusFilter?: 'all' | 'pendiente' | 'pagado' | 'parcial';
}) {
  const { sales, getClient } = useStore();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendiente' | 'pagado' | 'parcial'>(initialStatusFilter ?? 'all');

  const displaySales = useMemo(() => {
    let result = [...sales]
      .filter(s => getClient(s.clientId) !== undefined)
      .sort((a, b) => b.date.localeCompare(a.date));
    if (statusFilter !== 'all') result = result.filter(s => s.paymentStatus === statusFilter);
    return result;
  }, [sales, getClient, statusFilter]);

  const grouped = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const map = new Map<string, typeof displaySales>();
    for (const s of displaySales) {
      if (!map.has(s.date)) map.set(s.date, []);
      map.get(s.date)!.push(s);
    }
    return Array.from(map.entries()).map(([dateStr, items]) => {
      let label: string;
      if (dateStr === today) label = 'Hoy';
      else if (dateStr === yesterday) label = 'Ayer';
      else {
        const d = new Date(dateStr + 'T12:00:00');
        label = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
      }
      const dayTotal = items.filter(s => s.paymentStatus === 'pagado').reduce((sum, s) => sum + s.total, 0);
      return { label, dateStr, dayTotal, items };
    });
  }, [displaySales]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <div className="ios-nav" style={{ padding: '16px 16px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 className="ios-nav-title" style={{ margin: 0 }}>Historial</h1>
          <button
            onClick={() => exportSalesToXlsx(displaySales, id => getClient(id)?.name ?? 'Eliminado')}
            className="ios-btn-text"
            style={{ fontSize: 13, padding: 0, color: 'var(--accent)' }}
          >
            Exportar CSV
          </button>
        </div>
        <div className="ios-segment">
          <button className={`ios-segment-btn ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>Todos</button>
          <button className={`ios-segment-btn ${statusFilter === 'pagado' ? 'active' : ''}`} onClick={() => setStatusFilter('pagado')}>Pagados</button>
          <button className={`ios-segment-btn ${statusFilter === 'parcial' ? 'active' : ''}`} onClick={() => setStatusFilter('parcial')} style={{ color: statusFilter === 'parcial' ? '#ff9500' : '' }}>Parcial</button>
          <button className={`ios-segment-btn ${statusFilter === 'pendiente' ? 'active' : ''}`} onClick={() => setStatusFilter('pendiente')} style={{ color: statusFilter === 'pendiente' ? '#ff3b30' : '' }}>Deben</button>
        </div>
      </div>

      <div className="screen-content" style={{ flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>
        {grouped.length === 0 ? (
          <div className="ios-empty">
            <div className="ios-empty-icon"><ClockIcon size={24} /></div>
            <h3>Sin ventas</h3>
            <p>No hay ventas en este filtro.</p>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.dateStr} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, padding: '0 2px' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {group.label}
                </p>
                {group.dayTotal > 0 && (
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
                    ${group.dayTotal.toLocaleString('es-AR')}
                  </p>
                )}
              </div>
              <div className="ios-list-group">
                {group.items.map(sale => {
                  const client = getClient(sale.clientId);
                  const summary = sale.items.length === 1
                    ? `${sale.items[0].productName}${sale.items[0].variantInfo ? ` · ${sale.items[0].variantInfo}` : ''}`
                    : `${sale.items.length} artículos`;
                  return (
                    <div key={sale.id} className="ios-list-item" style={{ cursor: 'pointer' }} onClick={() => onClientSelect(sale.clientId)}>
                      <div className="ios-avatar sm" style={{ background: 'var(--cat-clothing-bg)', color: 'var(--cat-clothing)' }}>
                        <ShirtIcon size={16} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                          {client?.name ?? 'Cliente eliminado'}
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {summary}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: sale.paymentStatus === 'pendiente' ? '#ff3b30' : sale.paymentStatus === 'parcial' ? '#ff9500' : 'var(--text-primary)' }}>
                          ${sale.total.toLocaleString('es-AR')}
                        </p>
                        {sale.paymentStatus === 'pendiente' && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#ff3b30', background: '#ff3b3015', padding: '1px 6px', borderRadius: 4, display: 'block', marginTop: 2 }}>DEBE</span>
                        )}
                        {sale.paymentStatus === 'parcial' && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#ff9500', background: '#ff950015', padding: '1px 6px', borderRadius: 4, display: 'block', marginTop: 2 }}>PARCIAL</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
