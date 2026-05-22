'use client';

import React, { useMemo, useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/context/ToastContext';
import { ChevronLeft, PlusIcon, TrashIcon, PackageIcon, EditIcon, ChevronRight } from './Icons';
import { getDbStockMovements } from '@/actions/dbActions';
import { ProductVariant, ProductWithVariants, StockMovement } from '@/types';

type View = 'list' | 'addProduct' | 'editProduct' | 'productDetail';

export default function InventoryScreen({ onBack }: { onBack: () => void }) {
  const { products, addProduct, updateProduct, deleteProduct, addVariant, updateVariant, deleteVariant, adjustVariantStock } = useStore();
  const { showToast } = useToast();

  const [view, setView] = useState<View>('list');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithVariants | null>(null);

  // Product form
  const [pName, setPName] = useState('');
  const [pCategory, setPCategory] = useState('Remeras');
  const [pBrand, setPBrand] = useState('');
  const [pSalePrice, setPSalePrice] = useState('');
  const [pCost, setPCost] = useState('');
  const [pSku, setPSku] = useState('');
  const [pDescription, setPDescription] = useState('');

  // Variant form
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [vSize, setVSize] = useState('');
  const [vColor, setVColor] = useState('');
  const [vStock, setVStock] = useState('0');
  const [vMinStock, setVMinStock] = useState('1');
  const [vLocation, setVLocation] = useState('');

  // Stock adjustment
  const [adjustingVariant, setAdjustingVariant] = useState<ProductVariant | null>(null);
  const [adjustStock, setAdjustStock] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // Movements
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [viewingMovementsFor, setViewingMovementsFor] = useState<string | null>(null);

  const CATEGORIES = ['Remeras', 'Pantalones', 'Vestidos', 'Calzado', 'Accesorios', 'Abrigos', 'Shorts', 'Faldas', 'Buzos', 'Otros'];

  const totalVariants = useMemo(() => products.reduce((s, p) => s + p.variants.length, 0), [products]);
  const lowStockVariants = useMemo(() => products.reduce((count, p) => count + p.variants.filter(v => v.stock > 0 && v.stock <= v.minStock).length, 0), [products]);
  const outOfStock = useMemo(() => products.reduce((count, p) => count + p.variants.filter(v => v.stock === 0).length, 0), [products]);
  const inventoryValueSale = useMemo(() => products.reduce((s, p) => s + p.variants.reduce((vs, v) => vs + v.stock * p.salePrice, 0), 0), [products]);
  const inventoryValueCost = useMemo(() => products.reduce((s, p) => s + p.variants.reduce((vs, v) => vs + v.stock * (p.cost ?? 0), 0), 0), [products]);

  const resetProductForm = () => { setPName(''); setPCategory('Remeras'); setPBrand(''); setPSalePrice(''); setPCost(''); setPSku(''); setPDescription(''); };
  const resetVariantForm = () => { setVSize(''); setVColor(''); setVStock('0'); setVMinStock('1'); setVLocation(''); setEditingVariant(null); };

  const openEditProduct = (p: ProductWithVariants) => {
    setPName(p.name); setPCategory(p.category); setPBrand(p.brand ?? ''); setPSalePrice(p.salePrice.toString()); setPCost(p.cost?.toString() ?? ''); setPSku(p.sku ?? ''); setPDescription(p.description ?? '');
    setSelectedProduct(p);
    setView('editProduct');
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addProduct({
        name: pName.trim(),
        category: pCategory,
        brand: pBrand.trim() || undefined,
        description: pDescription.trim() || undefined,
        salePrice: Number(pSalePrice),
        cost: pCost ? Number(pCost) : undefined,
        sku: pSku.trim() || undefined,
        status: 'active',
      });
      resetProductForm();
      setView('list');
      showToast('Producto creado', undefined, 'success');
    } catch (err) {
      console.error('Error al crear producto:', err);
      showToast('Error al guardar. Producto guardado localmente.', undefined, 'error');
    }
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      updateProduct(selectedProduct.id, {
        name: pName.trim(),
        category: pCategory,
        brand: pBrand.trim() || undefined,
        description: pDescription.trim() || undefined,
        salePrice: Number(pSalePrice),
        cost: pCost ? Number(pCost) : undefined,
        sku: pSku.trim() || undefined,
      });
      setView('list');
      showToast('Producto actualizado', undefined, 'success');
    } catch (err) {
      console.error('Error al actualizar producto:', err);
      showToast('Error al guardar. Cambio guardado localmente.', undefined, 'error');
    }
  };

  const handleDeleteProduct = (p: ProductWithVariants) => {
    if (!confirm(`¿Eliminar "${p.name}" y todas sus variantes?`)) return;
    const undo = deleteProduct(p.id);
    showToast(`"${p.name}" eliminado`, undo);
  };

  const openAddVariant = () => { resetVariantForm(); setShowVariantForm(true); };
  const openEditVariant = (v: ProductVariant) => {
    setEditingVariant(v); setVSize(v.size ?? ''); setVColor(v.color ?? ''); setVStock(v.stock.toString()); setVMinStock(v.minStock.toString()); setVLocation(v.location ?? '');
    setShowVariantForm(true);
  };

  const handleSaveVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (editingVariant) {
      updateVariant(editingVariant.id, selectedProduct.id, { size: vSize.trim() || undefined, color: vColor.trim() || undefined, stock: Number(vStock), minStock: Number(vMinStock), location: vLocation.trim() || undefined });
      showToast('Variante actualizada', undefined, 'success');
    } else {
      await addVariant({ productId: selectedProduct.id, size: vSize.trim() || undefined, color: vColor.trim() || undefined, stock: Number(vStock), minStock: Number(vMinStock), location: vLocation.trim() || undefined });
      showToast('Variante agregada', undefined, 'success');
    }
    resetVariantForm();
    setShowVariantForm(false);
    // Refresh selected product from state
    setSelectedProduct(prev => {
      if (!prev) return prev;
      const updated = products.find(p => p.id === prev.id);
      return updated ?? prev;
    });
  };

  const handleDeleteVariant = (v: ProductVariant) => {
    if (!selectedProduct) return;
    if (!confirm(`¿Eliminar variante ${[v.size, v.color].filter(Boolean).join(' / ') || 'sin nombre'}?`)) return;
    const undo = deleteVariant(v.id, selectedProduct.id);
    showToast('Variante eliminada', undo);
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingVariant || !selectedProduct) return;
    await adjustVariantStock(adjustingVariant.id, selectedProduct.id, Number(adjustStock), adjustReason.trim() || 'Ajuste manual');
    setAdjustingVariant(null);
    setAdjustStock('');
    setAdjustReason('');
    // Refresh selected product
    setSelectedProduct(prev => {
      if (!prev) return prev;
      const updated = products.find(p => p.id === prev.id);
      return updated ?? prev;
    });
    showToast('Stock ajustado', undefined, 'success');
  };

  const loadMovements = async (variantId: string) => {
    setViewingMovementsFor(variantId);
    const mvs = await getDbStockMovements(variantId);
    setMovements(mvs);
  };

  const MOVEMENT_LABELS: Record<string, { label: string; color: string }> = {
    ingreso: { label: 'Ingreso', color: '#34c759' },
    venta: { label: 'Venta', color: '#ff3b30' },
    ajuste: { label: 'Ajuste', color: '#ff9500' },
    devolucion: { label: 'Devolución', color: '#007aff' },
  };

  const currentProduct = selectedProduct ? products.find(p => p.id === selectedProduct.id) ?? selectedProduct : null;

  // ── PRODUCT DETAIL ─────────────────────────────────────────────────────────
  if (view === 'productDetail' && currentProduct) {
    return (
      <div className="animate-slide-in app-screen-shell desktop-fixed-screen" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg-primary)' }}>
        <div className="ios-nav" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="ios-btn-text" style={{ padding: 0 }} onClick={() => { setView('list'); setViewingMovementsFor(null); }}><ChevronLeft size={24} /> Volver</button>
          <span style={{ fontWeight: 600, fontSize: 17, flex: 1, textAlign: 'center', marginRight: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentProduct.name}</span>
          <button className="ios-btn-icon" style={{ color: 'var(--accent)' }} onClick={() => openEditProduct(currentProduct)}><EditIcon size={20} /></button>
        </div>

        <div className="screen-content" style={{ flex: 1, overflowY: 'auto', paddingBottom: 'var(--screen-bottom-space, 120px)' }}>
          {/* Product info */}
          <div className="ios-card" style={{ padding: '16px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{currentProduct.name}</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{[currentProduct.category, currentProduct.brand].filter(Boolean).join(' · ')}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-deep)' }}>${currentProduct.salePrice.toLocaleString('es-AR')}</p>
                {currentProduct.cost && <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Costo: ${currentProduct.cost.toLocaleString('es-AR')}</p>}
              </div>
            </div>
            {currentProduct.sku && <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>SKU: {currentProduct.sku}</p>}
          </div>

          {/* Variants */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 8 }}>
            <p className="ios-section-header" style={{ margin: 0, padding: 0 }}>Variantes</p>
            <button className="ios-btn-text" style={{ fontSize: 13, padding: 0, color: 'var(--accent-deep)', fontWeight: 600 }} onClick={openAddVariant}>
              <PlusIcon size={14} /> Agregar
            </button>
          </div>

          {currentProduct.variants.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>Sin variantes. Agregá talla/color para controlar el stock.</p>
            </div>
          ) : (
            <div className="ios-list-group" style={{ marginBottom: 24 }}>
              {currentProduct.variants.map(v => {
                const label = [v.size && `T: ${v.size}`, v.color].filter(Boolean).join(' / ') || 'Sin nombre';
                const isLow = v.stock > 0 && v.stock <= v.minStock;
                const isOut = v.stock === 0;
                return (
                  <div key={v.id} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '0.5px solid var(--separator-opaque)' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: 15 }}>{label}</p>
                      {v.location && <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Ubicación: {v.location}</p>}
                    </div>
                    <div style={{ textAlign: 'right', marginRight: 4 }}>
                      <p style={{ fontSize: 16, fontWeight: 700, color: isOut ? '#ff3b30' : isLow ? '#ff9500' : '#34c759' }}>
                        {v.stock}
                      </p>
                      <p style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>mín. {v.minStock}</p>
                    </div>
                    <button
                      className="ios-btn-icon"
                      style={{ width: 28, height: 28, color: '#007aff', fontSize: 11, fontWeight: 700 }}
                      onClick={() => { setAdjustingVariant(v); setAdjustStock(v.stock.toString()); setAdjustReason(''); }}
                      title="Ajustar stock"
                    >
                      ±
                    </button>
                    <button className="ios-btn-icon" style={{ width: 28, height: 28, color: 'var(--accent)' }} onClick={() => openEditVariant(v)}>
                      <EditIcon size={15} />
                    </button>
                    <button className="ios-btn-icon" style={{ width: 28, height: 28, color: 'var(--text-tertiary)' }} onClick={() => handleDeleteVariant(v)}>
                      <TrashIcon size={15} />
                    </button>
                    <button
                      className="ios-btn-icon"
                      style={{ width: 28, height: 28, color: 'var(--text-secondary)' }}
                      onClick={() => viewingMovementsFor === v.id ? setViewingMovementsFor(null) : loadMovements(v.id)}
                      title="Ver movimientos"
                    >
                      <ChevronRight size={16} style={{ transform: viewingMovementsFor === v.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Movement history for selected variant */}
          {viewingMovementsFor && (
            <div style={{ marginBottom: 24 }}>
              <p className="ios-section-header">Movimientos de stock</p>
              {movements.length === 0 ? (
                <p style={{ padding: '16px', fontSize: 14, color: 'var(--text-tertiary)', textAlign: 'center' }}>Sin movimientos registrados.</p>
              ) : (
                <div className="ios-list-group">
                  {movements.map(m => {
                    const info = MOVEMENT_LABELS[m.type] ?? { label: m.type, color: 'var(--text-secondary)' };
                    return (
                      <div key={m.id} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '0.5px solid var(--separator-opaque)' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${info.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: info.color }}>
                            {m.quantity > 0 ? '+' : ''}{m.quantity}
                          </span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: info.color }}>{info.label}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.reason ?? ''} · {m.date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Variant form sheet */}
        {showVariantForm && (
          <div className="ios-sheet-backdrop" onClick={e => { if (e.target === e.currentTarget) { setShowVariantForm(false); resetVariantForm(); } }}>
            <div className="ios-sheet" onClick={e => e.stopPropagation()}>
              <div className="ios-sheet-handle" />
              <div className="ios-sheet-header">
                <button className="ios-btn-text" onClick={() => { setShowVariantForm(false); resetVariantForm(); }}>Cancelar</button>
                <h2>{editingVariant ? 'Editar Variante' : 'Nueva Variante'}</h2>
                <div style={{ width: 60 }} />
              </div>
              <form onSubmit={handleSaveVariant} style={{ padding: 16 }}>
                <div className="ios-input-group" style={{ marginBottom: 24 }}>
                  <div className="ios-input-row"><label>Talle</label><input type="text" value={vSize} onChange={e => setVSize(e.target.value)} placeholder="Ej: M, L, 42..." autoFocus /></div>
                  <div className="ios-input-row"><label>Color</label><input type="text" value={vColor} onChange={e => setVColor(e.target.value)} placeholder="Ej: Negro, Blanco..." /></div>
                  <div className="ios-input-row"><label>Stock inicial</label><input type="number" value={vStock} onChange={e => setVStock(e.target.value)} required min="0" /></div>
                  <div className="ios-input-row"><label>Stock mínimo</label><input type="number" value={vMinStock} onChange={e => setVMinStock(e.target.value)} required min="0" /></div>
                  <div className="ios-input-row"><label>Ubicación</label><input type="text" value={vLocation} onChange={e => setVLocation(e.target.value)} placeholder="Ej: Perchero A" /></div>
                </div>
                <button type="submit" className="ios-btn-primary">{editingVariant ? 'Guardar Cambios' : 'Agregar Variante'}</button>
              </form>
            </div>
          </div>
        )}

        {/* Stock adjustment sheet */}
        {adjustingVariant && (
          <div className="ios-sheet-backdrop" onClick={e => { if (e.target === e.currentTarget) setAdjustingVariant(null); }}>
            <div className="ios-sheet" onClick={e => e.stopPropagation()}>
              <div className="ios-sheet-handle" />
              <div className="ios-sheet-header">
                <button className="ios-btn-text" onClick={() => setAdjustingVariant(null)}>Cancelar</button>
                <h2>Ajustar Stock</h2>
                <div style={{ width: 60 }} />
              </div>
              <form onSubmit={handleAdjustStock} style={{ padding: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, textAlign: 'center' }}>
                  {[adjustingVariant.size && `T: ${adjustingVariant.size}`, adjustingVariant.color].filter(Boolean).join(' / ') || 'Variante'} — Stock actual: {adjustingVariant.stock}
                </p>
                <div className="ios-input-group" style={{ marginBottom: 24 }}>
                  <div className="ios-input-row"><label>Nuevo stock</label><input type="number" value={adjustStock} onChange={e => setAdjustStock(e.target.value)} required min="0" autoFocus /></div>
                  <div className="ios-input-row"><label>Motivo</label><input type="text" value={adjustReason} onChange={e => setAdjustReason(e.target.value)} placeholder="Ej: Conteo físico" /></div>
                </div>
                <button type="submit" className="ios-btn-primary">Confirmar Ajuste</button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── ADD / EDIT PRODUCT FORM ────────────────────────────────────────────────
  if (view === 'addProduct' || view === 'editProduct') {
    return (
      <div className="animate-slide-in app-screen-shell desktop-fixed-screen" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg-primary)' }}>
        <div className="ios-nav" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="ios-btn-text" style={{ padding: 0 }} onClick={() => setView('list')}><ChevronLeft size={24} /> Volver</button>
          <span style={{ fontWeight: 600, fontSize: 17 }}>{view === 'addProduct' ? 'Nuevo Producto' : 'Editar Producto'}</span>
          <div style={{ width: 60 }} />
        </div>
        <div className="screen-content" style={{ flex: 1, overflowY: 'auto', paddingBottom: 'var(--screen-bottom-space, 100px)' }}>
          <form onSubmit={view === 'addProduct' ? handleAddProduct : handleUpdateProduct} className="form-shell">
            <div className="ios-input-group" style={{ marginBottom: 24 }}>
              <div className="ios-input-row"><label>Nombre *</label><input type="text" value={pName} onChange={e => setPName(e.target.value)} required placeholder="Ej: Remera Oversize Básica" autoFocus /></div>
              <div className="ios-input-row">
                <label>Categoría *</label>
                <select value={pCategory} onChange={e => setPCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="ios-input-row"><label>Marca</label><input type="text" value={pBrand} onChange={e => setPBrand(e.target.value)} placeholder="Ej: Zara, H&M..." /></div>
              <div className="ios-input-row"><label>SKU</label><input type="text" value={pSku} onChange={e => setPSku(e.target.value)} placeholder="Código interno" /></div>
            </div>
            <div className="ios-input-group" style={{ marginBottom: 24 }}>
              <div className="ios-input-row">
                <label>Precio venta *</label>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                  <span style={{ color: 'var(--text-tertiary)', marginRight: 4 }}>$</span>
                  <input type="number" value={pSalePrice} onChange={e => setPSalePrice(e.target.value)} required min="0" placeholder="0.00" style={{ flex: 'none', width: '110px' }} />
                </div>
              </div>
              <div className="ios-input-row">
                <label>Costo</label>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                  <span style={{ color: 'var(--text-tertiary)', marginRight: 4 }}>$</span>
                  <input type="number" value={pCost} onChange={e => setPCost(e.target.value)} min="0" placeholder="Opcional" style={{ flex: 'none', width: '110px' }} />
                </div>
              </div>
            </div>
            <div className="ios-input-group" style={{ marginBottom: 32 }}>
              <div className="ios-input-row" style={{ alignItems: 'flex-start' }}>
                <label style={{ paddingTop: 8 }}>Descripción</label>
                <textarea value={pDescription} onChange={e => setPDescription(e.target.value)} placeholder="Detalles del producto..." style={{ resize: 'none', minHeight: 60 }} />
              </div>
            </div>
            <button type="submit" className="ios-btn-primary">{view === 'addProduct' ? 'Crear Producto' : 'Guardar Cambios'}</button>
          </form>
        </div>
      </div>
    );
  }

  // ── PRODUCT LIST ────────────────────────────────────────────────────────────
  return (
    <div className="animate-slide-in app-screen-shell desktop-fixed-screen" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg-primary)' }}>
      <div className="ios-nav" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="ios-btn-text" style={{ padding: 0 }} onClick={onBack}><ChevronLeft size={24} /> Volver</button>
        <span style={{ fontWeight: 600, fontSize: 17 }}>Inventario</span>
        <button className="ios-btn-icon" onClick={() => { resetProductForm(); setView('addProduct'); }}><PlusIcon size={24} /></button>
      </div>

      <div className="screen-content" style={{ flex: 1, overflowY: 'auto', paddingBottom: 'var(--screen-bottom-space, 100px)' }}>
        {/* Stats */}
        {products.length > 0 && (
          <>
            <div className="stats-grid" style={{ display: 'grid', gap: 12, marginBottom: 12 }}>
              <div className="ios-card" style={{ padding: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Variantes</p>
                <p style={{ fontSize: 22, fontWeight: 700 }}>{totalVariants}</p>
              </div>
              <div className="ios-card" style={{ padding: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Stock bajo</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: lowStockVariants > 0 ? '#ff9500' : 'var(--text-primary)' }}>{lowStockVariants}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div className="ios-card" style={{ padding: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Sin stock</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: outOfStock > 0 ? '#ff3b30' : 'var(--text-primary)' }}>{outOfStock}</p>
              </div>
              <div className="ios-card" style={{ padding: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Valor en stock</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-deep)' }}>${inventoryValueSale.toLocaleString('es-AR')}</p>
                {inventoryValueCost > 0 && <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>Costo: ${inventoryValueCost.toLocaleString('es-AR')}</p>}
              </div>
            </div>
          </>
        )}

        {products.length === 0 ? (
          <div className="ios-empty">
            <PackageIcon size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <h3>Sin productos</h3>
            <p>Cargá tus prendas para controlar el stock y las ventas.</p>
            <button className="ios-btn-text" style={{ marginTop: 12, fontWeight: 600 }} onClick={() => { resetProductForm(); setView('addProduct'); }}>
              <PlusIcon size={18} /> Agregar Producto
            </button>
          </div>
        ) : (
          <div className="ios-list-group">
            {products.map(p => {
              const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
              const hasLow = p.variants.some(v => v.stock > 0 && v.stock <= v.minStock);
              const hasOut = p.variants.some(v => v.stock === 0);
              return (
                <div key={p.id} className="ios-list-item" style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => { setSelectedProduct(p); setView('productDetail'); setViewingMovementsFor(null); }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--cat-clothing-bg)', color: 'var(--cat-clothing)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, fontWeight: 700 }}>
                    {p.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {p.category}{p.brand ? ` · ${p.brand}` : ''} · {p.variants.length} variante{p.variants.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', marginRight: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-deep)' }}>${p.salePrice.toLocaleString('es-AR')}</p>
                    <p style={{ fontSize: 11, fontWeight: 600, color: hasOut ? '#ff3b30' : hasLow ? '#ff9500' : '#34c759' }}>
                      {totalStock} en stock
                    </p>
                  </div>
                  <button className="ios-btn-icon" style={{ width: 28, height: 28, color: 'var(--text-tertiary)' }} onClick={e => { e.stopPropagation(); handleDeleteProduct(p); }}>
                    <TrashIcon size={16} />
                  </button>
                  <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
