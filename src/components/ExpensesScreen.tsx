'use client';

import React, { useMemo, useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/context/ToastContext';
import { ChevronLeft, PlusIcon, TrashIcon, DollarIcon } from './Icons';
import { Expense, ExpenseCategory } from '@/types';

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'mercaderia', label: 'Mercadería' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'sueldos', label: 'Sueldos' },
  { value: 'marketing', label: 'Marketing / Publicidad' },
  { value: 'envios', label: 'Envíos' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'otros', label: 'Otros' },
];

const CAT_LABEL: Record<string, string> = Object.fromEntries(EXPENSE_CATEGORIES.map(c => [c.value, c.label]));

export default function ExpensesScreen({ onBack }: { onBack: () => void }) {
  const { expenses, addExpense, deleteExpense } = useStore();
  const { showToast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ExpenseCategory>('mercaderia');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense({ description, amount: Number(amount), date, category });
    setDescription(''); setAmount(''); setCategory('mercaderia');
    setShowAddForm(false);
    showToast('Gasto registrado', undefined, 'success');
  };

  const sorted = useMemo(() => [...expenses].sort((a, b) => b.date.localeCompare(a.date)), [expenses]);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const totalMonth = useMemo(
    () => expenses.filter(e => e.date.startsWith(currentMonth)).reduce((s, e) => s + e.amount, 0),
    [expenses, currentMonth]
  );

  const handleDelete = (e: Expense) => {
    if (!confirm(`¿Eliminar "${e.description}"?`)) return;
    const undo = deleteExpense(e.id);
    showToast(`Gasto eliminado`, undo);
  };

  return (
    <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg-primary)' }}>
      <div className="ios-nav" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="ios-btn-text" style={{ padding: 0 }} onClick={onBack}><ChevronLeft size={24} /> Volver</button>
        <span style={{ fontWeight: 600, fontSize: 17 }}>Gastos</span>
        <button className="ios-btn-icon" onClick={() => setShowAddForm(true)}><PlusIcon size={24} /></button>
      </div>

      <div className="screen-content" style={{ flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>
        {expenses.length > 0 && (
          <div className="ios-card" style={{ padding: 18, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Gastos del mes</p>
              <p style={{ fontSize: 26, fontWeight: 700, color: '#ff3b30' }}>-${totalMonth.toLocaleString('es-AR')}</p>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#ff3b3015', color: '#ff3b30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarIcon size={18} />
            </div>
          </div>
        )}

        {expenses.length === 0 ? (
          <div className="ios-empty">
            <DollarIcon size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <h3>Sin gastos registrados</h3>
            <p>Registrá tus costos para tener un balance real.</p>
          </div>
        ) : (
          <div className="ios-list-group">
            {sorted.map(e => (
              <div key={e.id} className="ios-list-item" style={{ padding: '12px 16px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 15 }}>{e.description}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {e.date} · {CAT_LABEL[e.category] ?? e.category}
                  </p>
                </div>
                <p style={{ fontWeight: 700, color: '#ff3b30', marginRight: 12 }}>-${e.amount.toLocaleString('es-AR')}</p>
                <button className="ios-btn-icon" style={{ color: 'var(--text-tertiary)' }} onClick={() => handleDelete(e)}>
                  <TrashIcon size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="ios-sheet-backdrop" onClick={() => setShowAddForm(false)}>
          <div className="ios-sheet" onClick={e => e.stopPropagation()}>
            <div className="ios-sheet-handle" />
            <div className="ios-sheet-header">
              <button className="ios-btn-text" onClick={() => setShowAddForm(false)}>Cancelar</button>
              <h2>Registrar Gasto</h2>
              <div style={{ width: 60 }} />
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 16 }}>
              <div className="ios-input-group" style={{ marginBottom: 24 }}>
                <div className="ios-input-row">
                  <label>Descripción</label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)} required placeholder="Ej: Compra de ropa a proveedor" autoFocus />
                </div>
                <div className="ios-input-row">
                  <label>Monto</label>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" min="0" />
                </div>
                <div className="ios-input-row">
                  <label>Fecha</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
                <div className="ios-input-row">
                  <label>Categoría</label>
                  <select value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)}>
                    {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="ios-btn-primary" style={{ background: '#ff3b30' }}>Guardar Gasto</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
