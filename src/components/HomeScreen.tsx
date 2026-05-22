'use client';

import React from 'react';
import { useStore } from '@/store/StoreContext';
import { ShirtIcon, ClockIcon, UsersIcon, SunIcon, MoonIcon, PackageIcon, ChevronRight } from './Icons';
import { logoutAction } from '@/app/login/actions';

export default function HomeScreen({ onGoToClients, onGoToAdd, onGoToHistory, onClientSelect, onGoToInventory }: {
  onGoToClients: () => void;
  onGoToAdd: () => void;
  onGoToHistory: () => void;
  onClientSelect: (id: string) => void;
  onGoToInventory: () => void;
}) {
  const { clients, sales, products, getRecentSales, getClient, isDarkMode, toggleDarkMode, payments } = useStore();

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.date === todayStr);
  const todayRevenue = payments
    .filter(p => p.date === todayStr)
    .reduce((s, p) => s + p.amount, 0);
  const pendingCount = sales.filter(s => s.paymentStatus !== 'pagado').length;

  const lowStockCount = products.reduce((count, p) =>
    count + p.variants.filter(v => v.stock > 0 && v.stock <= v.minStock).length, 0);
  const outOfStockCount = products.reduce((count, p) =>
    count + p.variants.filter(v => v.stock === 0).length, 0);

  const recentSales = getRecentSales(8).filter(s => getClient(s.clientId));

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  };

  const todayLabel = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="animate-fade-in screen-content home-screen-root app-screen-shell">
      <div className="home-header">
        <div>
          <p className="home-date">{todayLabel}</p>
          <h1 className="ios-nav-title" style={{ fontSize: 28, lineHeight: 1.1 }}>Tienda</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={toggleDarkMode}
            className="ios-btn-icon"
            style={{ width: 36, height: 36, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-xs)', borderRadius: '50%' }}
            aria-label={isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
          >
            {isDarkMode ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </button>
          <form action={logoutAction}>
            <button
              type="submit"
              className="ios-btn-icon"
              style={{ width: 36, height: 36, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-xs)', borderRadius: '50%', fontSize: 16 }}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              🔒
            </button>
          </form>
        </div>
      </div>

      <div className="home-layout">
        <div className="home-left">
          <div className="ios-card home-finance-card" aria-label="Resumen financiero del día">
            <div className="home-finance-item">
              <p className="home-finance-label">Cobrado hoy</p>
              <p className="home-finance-value" style={{ color: 'var(--success)' }}>
                {todayRevenue > 0 ? `$${todayRevenue.toLocaleString('es-AR')}` : '$0'}
              </p>
            </div>
            <div className="home-finance-divider" aria-hidden="true" />
            <div
              className="home-finance-item"
              style={{ cursor: pendingCount > 0 ? 'pointer' : 'default' }}
              onClick={pendingCount > 0 ? onGoToHistory : undefined}
              role={pendingCount > 0 ? 'button' : undefined}
              aria-label={pendingCount > 0 ? `Ver ${pendingCount} ventas pendientes` : undefined}
            >
              <p className="home-finance-label">Por cobrar</p>
              <p
                className="home-finance-value"
                style={{ color: pendingCount > 0 ? 'var(--warning)' : 'var(--text-tertiary)' }}
              >
                {pendingCount > 0 ? `${pendingCount} ventas` : 'Todo al día'}
              </p>
            </div>
          </div>

          <div className="stats-grid home-stats" aria-label="Estadísticas">
            <button
              className="ios-card home-stat-card"
              onClick={onGoToClients}
              aria-label={`${clients.length} clientes - ir a lista de clientes`}
            >
              <div className="home-stat-icon" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                <UsersIcon size={18} />
              </div>
              <p className="home-stat-value">{clients.length}</p>
              <p className="home-stat-label">Clientes</p>
            </button>

            <button
              className="ios-card home-stat-card"
              onClick={onGoToHistory}
              aria-label={`${todaySales.length} ventas hoy - ir a historial`}
            >
              <div className="home-stat-icon" style={{ background: 'var(--cat-clothing-bg)', color: 'var(--cat-clothing)' }}>
                <ClockIcon size={18} />
              </div>
              <p className="home-stat-value">{todaySales.length}</p>
              <p className="home-stat-label">Ventas hoy</p>
            </button>
          </div>

          {(lowStockCount > 0 || outOfStockCount > 0) && (
            <button
              className="home-stock-alert"
              onClick={onGoToInventory}
              aria-label={`Alerta de stock: ${outOfStockCount > 0 ? `${outOfStockCount} sin stock, ` : ''}${lowStockCount} con stock bajo - ir a inventario`}
            >
              <PackageIcon size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
              <span className="home-stock-alert-text">
                {outOfStockCount > 0 && <strong>{outOfStockCount} sin stock</strong>}
                {outOfStockCount > 0 && lowStockCount > 0 && ' · '}
                {lowStockCount > 0 && `${lowStockCount} con stock bajo`}
              </span>
              <ChevronRight size={14} style={{ color: 'var(--text-tertiary)', marginLeft: 'auto', flexShrink: 0 }} />
            </button>
          )}

          <div className="home-actions" role="group" aria-label="Acciones principales">
            <button
              className="ios-btn-primary home-btn-venta"
              onClick={onGoToAdd}
              id="btn-quick-add"
              aria-label="Registrar nueva venta"
            >
              <ShirtIcon size={20} aria-hidden="true" />
              Registrar Venta
            </button>

            <button
              className="home-btn-inventario"
              onClick={onGoToInventory}
              id="btn-inventory"
              aria-label="Ver y gestionar inventario y stock"
            >
              <div className="home-btn-inventario-left">
                <div className="home-btn-inventario-icon" aria-hidden="true">
                  <PackageIcon size={20} />
                </div>
                <div>
                  <p className="home-btn-inventario-title">Inventario &amp; Stock</p>
                  <p className="home-btn-inventario-sub">
                    {products.length} producto{products.length !== 1 ? 's' : ''}
                    {(lowStockCount > 0 || outOfStockCount > 0) && (
                      <span style={{ color: 'var(--warning)' }}>
                        {' · '}
                        {outOfStockCount > 0 ? `${outOfStockCount} sin stock` : `${lowStockCount} bajo`}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="home-recent home-right">
          <div className="home-recent-header">
            <p className="ios-section-header" style={{ padding: 0 }}>Ventas recientes</p>
            {recentSales.length > 0 && (
              <button
                className="ios-btn-text"
                style={{ fontSize: 14, padding: '0 0 0 8px' }}
                onClick={onGoToHistory}
                aria-label="Ver historial completo de ventas"
              >
                Ver todo
              </button>
            )}
          </div>

          {recentSales.length === 0 ? (
            <div className="ios-empty" style={{ padding: '28px 16px' }}>
              <div className="ios-empty-icon"><ClockIcon size={22} /></div>
              <h3>Sin ventas aún</h3>
              <p>Registrá tu primera venta para ver la actividad acá.</p>
            </div>
          ) : (
            <div className="ios-list-group">
              {recentSales.map(sale => {
                const client = getClient(sale.clientId);
                const itemSummary = sale.items.length === 1
                  ? sale.items[0].productName
                  : `${sale.items.length} artículos`;
                return (
                  <div
                    key={sale.id}
                    className="ios-list-item"
                    onClick={() => client && onClientSelect(sale.clientId)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Venta a ${client?.name ?? 'cliente'}: ${itemSummary}, $${sale.total.toLocaleString('es-AR')}`}
                    onKeyDown={e => e.key === 'Enter' && client && onClientSelect(sale.clientId)}
                  >
                    <div className="ios-avatar sm" style={{ background: 'var(--cat-clothing-bg)', color: 'var(--cat-clothing)' }}>
                      <ShirtIcon size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                        {client?.name ?? 'Cliente eliminado'}
                      </p>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {itemSummary}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatDate(sale.date)}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        ${sale.total.toLocaleString('es-AR')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
