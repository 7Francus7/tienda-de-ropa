'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/context/ToastContext';
import { ChevronLeft, PlusIcon, TrashIcon, PackageIcon, ShirtIcon } from './Icons';
import { ProductWithVariants } from '@/types';

interface PurchaseLineItem {
  variantId?: string;
  productName: string;
  variantInfo?: string;
  quantity: number;
  unitCost: number;
}

const emptyLine = (): PurchaseLineItem => ({
  variantId: undefined,
  productName: '',
  variantInfo: undefined,
  quantity: 1,
  unitCost: 0,
});

export default function PurchaseScreen({ onBack }: { onBack: () => void }) {
  const { products, addPurchase } = useStore();
  const { showToast } = useToast();

  const [supplierName, setSupplierName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PurchaseLineItem[]>([emptyLine()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeProducts = products.filter(p => p.status === 'active' && p.variants.length > 0);

  const updateItem = (idx: number, patch: Partial<PurchaseLineItem>) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };

  const handleProductSelect = (idx: number, productId: string) => {
    const product = activeProducts.find(p => p.id === productId);
    if (!product) {
      updateItem(idx, emptyLine());
      return;
    }
    updateItem(idx, {
      productName: product.name,
      variantId: product.variants.length === 1 ? product.variants[0].id : undefined,
      variantInfo: product.variants.length === 1 ? buildVariantInfo(product.variants[0]) : undefined,
      unitCost: product.cost ?? 0,
    });
  };

  const handleVariantSelect = (idx: number, variantId: string, product: ProductWithVariants) => {
    const variant = product.variants.find(v => v.id === variantId);
    if (!variant) return;
    updateItem(idx, {
      variantId: variant.id,
      variantInfo: buildVariantInfo(variant),
    });
  };

  const buildVariantInfo = (v: { size?: string; color?: string }) => {
    const parts = [v.size, v.color].filter(Boolean);
    return parts.length > 0 ? parts.join(' / ') : undefined;
  };

  const totalCost = items.reduce((s, it) => s + it.quantity * it.unitCost, 0);
  const isValid = items.every(it => it.productName.trim() && it.quantity > 0 && it.unitCost >= 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addPurchase({
        supplierName: supplierName.trim() || undefined,
        date,
        notes: notes.trim() || undefined,
        items: items.map(it => ({
          variantId:   it.variantId,
          productName: it.productName.trim(),
          variantInfo: it.variantInfo,
          quantity:    it.quantity,
          unitCost:    it.unitCost,
        })),
      });
      showToast('Ingreso de mercadería registrado', undefined, 'success');
      onBack();
    } catch {
      showToast('Error al registrar ingreso', undefined, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg-primary)' }}>
      <div className="ios-nav" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="ios-btn-text" style={{ padding: 0 }} onClick={onBack}>
          <ChevronLeft size={24} /> Volver
        </button>
        <span style={{ fontWeight: 600, fontSize: 17 }}>Ingreso de Mercadería</span>
        <div style={{ width: 60 }} />
      </div>

      <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>
        <div className="screen-content">

          {/* General info */}
          <div className="ios-input-group" style={{ marginBottom: 24 }}>
            <div className="ios-input-row">
              <label>Proveedor</label>
              <input
                type="text"
                value={supplierName}
                onChange={e => setSupplierName(e.target.value)}
                placeholder="Nombre del proveedor (opcional)"
              />
            </div>
            <div className="ios-input-row">
              <label>Fecha</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="ios-input-row" style={{ alignItems: 'flex-start' }}>
              <label style={{ paddingTop: 8 }}>Notas</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Notas opcionales (factura, condiciones, etc.)"
                style={{ resize: 'none', minHeight: 60 }}
              />
            </div>
          </div>

          {/* Items */}
          <p className="ios-section-header">Artículos ingresados</p>

          {items.map((item, idx) => {
            const selectedProduct = item.variantId
              ? activeProducts.find(p => p.variants.some(v => v.id === item.variantId))
              : activeProducts.find(p => p.name === item.productName);

            return (
              <div key={idx} className="ios-card" style={{ marginBottom: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Artículo {idx + 1}
                  </p>
                  {items.length > 1 && (
                    <button
                      type="button"
                      className="ios-btn-icon"
                      style={{ width: 28, height: 28, color: 'var(--text-tertiary)' }}
                      onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                    >
                      <TrashIcon size={16} />
                    </button>
                  )}
                </div>

                {/* Product selector */}
                <div className="ios-input-group" style={{ marginBottom: 0 }}>
                  <div className="ios-input-row">
                    <label>Producto</label>
                    {activeProducts.length > 0 ? (
                      <select
                        value={selectedProduct?.id ?? ''}
                        onChange={e => {
                          if (e.target.value === '__manual__') {
                            updateItem(idx, { ...emptyLine(), productName: '' });
                          } else {
                            handleProductSelect(idx, e.target.value);
                          }
                        }}
                      >
                        <option value="">Seleccionar producto...</option>
                        {activeProducts.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                        <option value="__manual__">Ingresar manualmente</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={item.productName}
                        onChange={e => updateItem(idx, { productName: e.target.value })}
                        placeholder="Nombre del producto"
                        required
                      />
                    )}
                  </div>

                  {/* Manual name if no product selected */}
                  {activeProducts.length > 0 && !selectedProduct && (
                    <div className="ios-input-row">
                      <label>Nombre</label>
                      <input
                        type="text"
                        value={item.productName}
                        onChange={e => updateItem(idx, { productName: e.target.value })}
                        placeholder="Nombre del artículo"
                        required
                      />
                    </div>
                  )}

                  {/* Variant selector */}
                  {selectedProduct && selectedProduct.variants.length > 1 && (
                    <div className="ios-input-row">
                      <label>Variante</label>
                      <select
                        value={item.variantId ?? ''}
                        onChange={e => handleVariantSelect(idx, e.target.value, selectedProduct)}
                        required
                      >
                        <option value="">Seleccionar variante...</option>
                        {selectedProduct.variants.map(v => (
                          <option key={v.id} value={v.id}>
                            {[v.size, v.color].filter(Boolean).join(' / ') || v.id} (stock: {v.stock})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="ios-input-row">
                    <label>Cantidad</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => updateItem(idx, { quantity: Math.max(1, Number(e.target.value)) })}
                      min="1"
                      required
                      style={{ flex: 'none', width: '80px' }}
                    />
                  </div>

                  <div className="ios-input-row">
                    <label>Costo unitario</label>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-tertiary)', marginRight: 4 }}>$</span>
                      <input
                        type="number"
                        value={item.unitCost || ''}
                        onChange={e => updateItem(idx, { unitCost: Number(e.target.value) })}
                        placeholder="0"
                        min="0"
                        required
                        style={{ flex: 'none', width: '110px' }}
                      />
                    </div>
                  </div>

                  {/* Subtotal display */}
                  {item.quantity > 0 && item.unitCost > 0 && (
                    <div style={{ padding: '10px 0 2px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Subtotal</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>
                        ${(item.quantity * item.unitCost).toLocaleString('es-AR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add item button */}
          <button
            type="button"
            className="ios-btn-secondary"
            style={{ width: '100%', marginBottom: 24, gap: 6 }}
            onClick={() => setItems(prev => [...prev, emptyLine()])}
          >
            <PlusIcon size={18} /> Agregar artículo
          </button>

          {/* Total */}
          {totalCost > 0 && (
            <div className="ios-card" style={{ padding: '16px 20px', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(52,199,89,0.1)', color: '#34c759', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PackageIcon size={18} />
                  </div>
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>Costo total del ingreso</p>
                    <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
                      ${totalCost.toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {items.reduce((s, it) => s + it.quantity, 0)} unidades
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="ios-btn-primary"
            disabled={!isValid || isSubmitting}
            style={{ background: '#34c759' }}
          >
            <ShirtIcon size={20} />
            {isSubmitting ? 'Guardando...' : 'Confirmar Ingreso'}
          </button>
        </div>
      </form>
    </div>
  );
}
