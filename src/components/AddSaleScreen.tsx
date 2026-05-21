'use client';

import React, { useMemo, useState, useRef } from 'react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/context/ToastContext';
import { ChevronLeft, XIcon, ShirtIcon, PlusIcon, TrashIcon } from './Icons';
import { PaymentMethod, PaymentStatus, CartItem } from '@/types';
import AddClientSheet from './AddClientSheet';

export default function AddSaleScreen({ onBack }: { onBack: () => void }) {
  const { clients, products, addSale } = useStore();
  const { showToast } = useToast();
  const [showAddClient, setShowAddClient] = useState(false);

  // Sale form
  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pagado');
  const [discount, setDiscount] = useState('');
  const [initialPayment, setInitialPayment] = useState('');
  const [observations, setObservations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Add item form
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemProductId, setItemProductId] = useState('');
  const [itemVariantId, setItemVariantId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemVariantInfo, setItemVariantInfo] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');

  const sortedClients = useMemo(() => [...clients].sort((a, b) => a.name.localeCompare(b.name)), [clients]);
  const activeProducts = useMemo(() => products.filter(p => p.status === 'active'), [products]);

  const selectedProduct = useMemo(() => activeProducts.find(p => p.id === itemProductId), [activeProducts, itemProductId]);

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discountAmt = discount ? Number(discount) : 0;
  const total = Math.max(0, subtotal - discountAmt);
  const today = new Date().toISOString().split('T')[0];

  const handleProductSelect = (productId: string) => {
    setItemProductId(productId);
    setItemVariantId('');
    setItemVariantInfo('');
    const p = activeProducts.find(pr => pr.id === productId);
    if (p) {
      setItemName(p.name);
      setItemPrice(p.salePrice.toString());
    } else {
      setItemName('');
      setItemPrice('');
    }
  };

  const handleVariantSelect = (variantId: string) => {
    setItemVariantId(variantId);
    if (!variantId) { setItemVariantInfo(''); return; }
    const variant = selectedProduct?.variants.find(v => v.id === variantId);
    if (variant) {
      const parts = [variant.size && `T: ${variant.size}`, variant.color].filter(Boolean);
      setItemVariantInfo(parts.join(' / '));
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemPrice || !itemQty) return;
    setCart(prev => [...prev, {
      variantId: itemVariantId || undefined,
      productName: itemName.trim(),
      variantInfo: itemVariantInfo.trim() || undefined,
      quantity: Number(itemQty),
      unitPrice: Number(itemPrice),
    }]);
    setItemProductId('');
    setItemVariantId('');
    setItemName('');
    setItemVariantInfo('');
    setItemQty('1');
    setItemPrice('');
    setShowItemForm(false);
  };

  const removeFromCart = (index: number) => setCart(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || cart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addSale({
        clientId,
        date,
        items: cart,
        discount: discountAmt,
        paymentMethod,
        paymentStatus,
        observations: observations.trim() || undefined,
        initialPaymentAmount: paymentStatus === 'parcial' && initialPayment ? Number(initialPayment) : undefined,
      });
      showToast('Venta registrada', undefined, 'success');
      onBack();
    } catch {
      showToast('Error al registrar la venta', undefined, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <div className="ios-nav" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="ios-btn-text" style={{ padding: 0 }} onClick={onBack}>
          <ChevronLeft size={24} /> Volver
        </button>
        <span style={{ fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em' }}>Nueva Venta</span>
        <div style={{ width: 68 }} />
      </div>

      <div className="screen-content" style={{ flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>
        <form onSubmit={handleSubmit}>
          {/* Cliente + Fecha */}
          <p className="ios-section-header">Cliente</p>
          <div className="ios-input-group" style={{ marginBottom: 24 }}>
            <div className="ios-input-row">
              <label>Cliente</label>
              <select value={clientId} onChange={e => e.target.value === 'NEW' ? setShowAddClient(true) : setClientId(e.target.value)} required style={{ color: clientId ? 'var(--text-primary)' : 'var(--text-placeholder)' }}>
                <option value="" disabled>Seleccionar...</option>
                <option value="NEW" style={{ fontWeight: 'bold', color: 'var(--accent-deep)' }}>+ Nuevo Cliente</option>
                <optgroup label="Clientes">
                  {sortedClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </optgroup>
              </select>
            </div>
            <div className="ios-input-row">
              <label>Fecha</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required max={today} />
            </div>
          </div>

          {/* Artículos */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 8 }}>
            <p className="ios-section-header" style={{ margin: 0, padding: 0 }}>Artículos</p>
            <button type="button" className="ios-btn-text" style={{ fontSize: 13, padding: 0, color: 'var(--accent-deep)', fontWeight: 600 }} onClick={() => setShowItemForm(true)}>
              <PlusIcon size={14} /> Agregar
            </button>
          </div>

          {cart.length === 0 ? (
            <div style={{ padding: '20px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>Agregá al menos un artículo para continuar.</p>
              <button type="button" className="ios-btn-secondary" style={{ marginTop: 12 }} onClick={() => setShowItemForm(true)}>
                <PlusIcon size={16} /> Agregar artículo
              </button>
            </div>
          ) : (
            <div className="ios-list-group" style={{ marginBottom: 24 }}>
              {cart.map((item, idx) => (
                <div key={idx} className="ios-list-item" style={{ padding: '10px 16px' }}>
                  <div className="ios-avatar sm" style={{ background: 'var(--cat-clothing-bg)', color: 'var(--cat-clothing)' }}>
                    <ShirtIcon size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.productName}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {[item.variantInfo, `x${item.quantity}`].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginRight: 8 }}>
                    ${(item.unitPrice * item.quantity).toLocaleString('es-AR')}
                  </p>
                  <button type="button" className="ios-btn-icon" style={{ color: 'var(--text-tertiary)' }} onClick={() => removeFromCart(idx)}>
                    <TrashIcon size={16} />
                  </button>
                </div>
              ))}
              {/* Totals */}
              <div style={{ padding: '12px 16px', borderTop: '0.5px solid var(--separator-opaque)' }}>
                {discountAmt > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Subtotal</p>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>${subtotal.toLocaleString('es-AR')}</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <p style={{ fontSize: 13, color: '#34c759' }}>Descuento</p>
                      <p style={{ fontSize: 13, color: '#34c759' }}>-${discountAmt.toLocaleString('es-AR')}</p>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Total</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>${total.toLocaleString('es-AR')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Pago */}
          <p className="ios-section-header">Pago</p>
          <div className="ios-input-group" style={{ marginBottom: 24 }}>
            <div className="ios-input-row">
              <label>Descuento</label>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                <span style={{ color: 'var(--text-tertiary)', marginRight: 4 }}>$</span>
                <input type="number" placeholder="0" value={discount} onChange={e => setDiscount(e.target.value)} min="0" style={{ flex: 'none', width: '100px' }} />
              </div>
            </div>
            <div className="ios-input-row">
              <label>Método</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
            <div className="ios-input-row">
              <label>Estado</label>
              <div className="ios-segment sm" style={{ maxWidth: 240 }}>
                <button type="button" className={`ios-segment-btn ${paymentStatus === 'pagado' ? 'active' : ''}`} onClick={() => { setPaymentStatus('pagado'); setInitialPayment(''); }}>Pagado</button>
                <button type="button" className={`ios-segment-btn ${paymentStatus === 'parcial' ? 'active' : ''}`} onClick={() => setPaymentStatus('parcial')} style={{ color: paymentStatus === 'parcial' ? '#ff9500' : '' }}>Parcial</button>
                <button type="button" className={`ios-segment-btn ${paymentStatus === 'pendiente' ? 'active' : ''}`} onClick={() => { setPaymentStatus('pendiente'); setInitialPayment(''); }} style={{ color: paymentStatus === 'pendiente' ? '#ff3b30' : '' }}>Debe</button>
              </div>
            </div>
            {paymentStatus === 'parcial' && (
              <>
                <div className="ios-input-row">
                  <label>Entrega</label>
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                    <span style={{ color: 'var(--text-tertiary)', marginRight: 4 }}>$</span>
                    <input type="number" placeholder="0" value={initialPayment} onChange={e => setInitialPayment(e.target.value)} min="0" style={{ flex: 'none', width: '100px' }} />
                  </div>
                </div>
                <div className="ios-input-row" style={{ pointerEvents: 'none' }}>
                  <label style={{ color: '#ff3b30' }}>Debe</label>
                  <p style={{ fontSize: 16, fontWeight: 600, color: '#ff3b30', flex: 1, textAlign: 'right' }}>
                    ${Math.max(0, total - (initialPayment ? Number(initialPayment) : 0)).toLocaleString('es-AR')}
                  </p>
                </div>
              </>
            )}
            <div className="ios-input-row" style={{ alignItems: 'flex-start' }}>
              <label style={{ paddingTop: 8 }}>Notas</label>
              <textarea placeholder="Observaciones de la venta..." value={observations} onChange={e => setObservations(e.target.value)} style={{ resize: 'none', minHeight: 60 }} />
            </div>
          </div>

          <button type="submit" className="ios-btn-primary" style={{ marginBottom: 32 }} disabled={isSubmitting || cart.length === 0 || !clientId}>
            {isSubmitting ? 'Guardando...' : 'Confirmar Venta'}
          </button>
        </form>
      </div>

      {/* Add Item Sheet */}
      {showItemForm && (
        <div className="ios-sheet-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowItemForm(false); }}>
          <div className="ios-sheet" style={{ maxHeight: '85dvh', overflowY: 'auto' }}>
            <div className="ios-sheet-handle" />
            <div className="ios-sheet-header">
              <button className="ios-btn-text" onClick={() => setShowItemForm(false)}>Cancelar</button>
              <h2>Agregar Artículo</h2>
              <div style={{ width: 68 }} />
            </div>
            <form onSubmit={handleAddItem} style={{ padding: '8px 16px 24px' }}>
              <div className="ios-input-group" style={{ marginBottom: 20 }}>
                {activeProducts.length > 0 && (
                  <div className="ios-input-row">
                    <label>Del catálogo</label>
                    <select value={itemProductId} onChange={e => handleProductSelect(e.target.value)} style={{ color: itemProductId ? 'var(--text-primary)' : 'var(--text-placeholder)' }}>
                      <option value="">Manual (sin catálogo)</option>
                      <optgroup label="Productos">
                        {activeProducts.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                )}

                {selectedProduct && selectedProduct.variants.length > 0 && (
                  <div className="ios-input-row">
                    <label>Variante</label>
                    <select value={itemVariantId} onChange={e => handleVariantSelect(e.target.value)} style={{ color: itemVariantId ? 'var(--text-primary)' : 'var(--text-placeholder)' }}>
                      <option value="">Sin especificar</option>
                      {selectedProduct.variants.map(v => {
                        const label = [v.size && `T:${v.size}`, v.color].filter(Boolean).join(' / ');
                        return (
                          <option key={v.id} value={v.id} disabled={v.stock === 0}>
                            {label || `Variante`} — Stock: {v.stock}{v.stock === 0 ? ' (sin stock)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                <div className="ios-input-row">
                  <label>Nombre</label>
                  <input type="text" placeholder="Ej: Remera Oversize" value={itemName} onChange={e => setItemName(e.target.value)} required autoFocus={activeProducts.length === 0} />
                </div>
                {!itemVariantId && (
                  <div className="ios-input-row">
                    <label>Detalle</label>
                    <input type="text" placeholder="Ej: T:M / Negro" value={itemVariantInfo} onChange={e => setItemVariantInfo(e.target.value)} />
                  </div>
                )}
                <div className="ios-input-row">
                  <label>Precio unit.</label>
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                    <span style={{ color: 'var(--text-tertiary)', marginRight: 4 }}>$</span>
                    <input type="number" placeholder="0" value={itemPrice} onChange={e => setItemPrice(e.target.value)} required min="0" style={{ flex: 'none', width: '110px' }} />
                  </div>
                </div>
                <div className="ios-input-row">
                  <label>Cantidad</label>
                  <input type="number" value={itemQty} onChange={e => setItemQty(e.target.value)} required min="1" style={{ flex: 'none', width: '80px', textAlign: 'right' }} />
                </div>
              </div>
              {itemName && itemPrice && itemQty && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 12 }}>
                  Subtotal: ${(Number(itemPrice) * Number(itemQty)).toLocaleString('es-AR')}
                </p>
              )}
              <button type="submit" className="ios-btn-primary">Agregar al Carrito</button>
            </form>
          </div>
        </div>
      )}

      {showAddClient && (
        <AddClientSheet
          onClose={() => setShowAddClient(false)}
          onClientAdded={id => { setClientId(id); setShowAddClient(false); }}
        />
      )}
    </div>
  );
}
