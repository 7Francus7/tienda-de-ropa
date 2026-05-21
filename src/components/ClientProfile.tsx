'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/context/ToastContext';
import {
  ChevronLeft, TrashIcon, CheckIcon, WhatsAppIcon, ClockIcon,
  NoteIcon, DollarIcon, CreditCardIcon, PhoneIcon, BanknoteIcon, HistoryIcon, EditIcon, ShirtIcon,
} from './Icons';
import { Sale, Payment, PaymentMethod } from '@/types';

function PaymentStatusBadge({ status }: { status: 'pagado' | 'pendiente' | 'parcial' }) {
  if (status === 'pagado') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: '#34c75918', color: '#34c759',
        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
        letterSpacing: '0.03em', textTransform: 'uppercase',
      }}>
        <CheckIcon size={10} /> Pagado
      </span>
    );
  }
  if (status === 'parcial') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: '#ff950018', color: '#ff9500',
        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
        letterSpacing: '0.03em', textTransform: 'uppercase',
      }}>
        Parcial
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: '#ff3b3015', color: '#ff3b30',
      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
      letterSpacing: '0.03em', textTransform: 'uppercase',
    }}>
      Pendiente
    </span>
  );
}

function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  const map: Record<PaymentMethod, { label: string; icon: React.ReactNode; cls: string }> = {
    efectivo:      { label: 'Efectivo',       icon: <DollarIcon size={11} />,     cls: 'cash'     },
    tarjeta:       { label: 'Tarjeta',         icon: <CreditCardIcon size={11} />, cls: 'card'     },
    transferencia: { label: 'Transferencia',   icon: <PhoneIcon size={11} />,      cls: 'transfer' },
  };
  const { label, icon, cls } = map[method];
  return <span className={`ios-badge ${cls}`}>{icon} {label}</span>;
}

export default function ClientProfile({ clientId, onBack }: {
  clientId: string;
  onBack: () => void;
}) {
  const {
    getClient, getClientSales, deleteSale,
    updateClient, deleteClient,
    getSalePayments, addPayment, deletePayment, updatePayment,
  } = useStore();
  const { showToast } = useToast();

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesTemp, setNotesTemp] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Register payment state
  const [payingSale, setPayingSale] = useState<Sale | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('efectivo');
  const [payObs, setPayObs] = useState('');
  const [payError, setPayError] = useState<string | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Edit payment state
  const [editingPayment, setEditingPayment] = useState<{ payment: Payment; saleId: string } | null>(null);
  const [editPayDate, setEditPayDate] = useState('');
  const [editPayAmount, setEditPayAmount] = useState('');
  const [editPayMethod, setEditPayMethod] = useState<PaymentMethod>('efectivo');
  const [editPayObs, setEditPayObs] = useState('');
  const [editPayError, setEditPayError] = useState<string | null>(null);

  const client = getClient(clientId);

  if (!client) {
    return (
      <div className="ios-empty" style={{ height: '100dvh' }}>
        <h3>Cliente no encontrado</h3>
        <button className="ios-btn-text" onClick={onBack}>Volver</button>
      </div>
    );
  }

  const sales = getClientSales(clientId);
  const totalCompras = sales.length;

  const pendingDebt = sales.reduce((sum, s) => {
    if (s.paymentStatus === 'pagado') return sum;
    const paid = getSalePayments(s.id).reduce((a, p) => a + p.amount, 0);
    return sum + Math.max(0, s.total - paid);
  }, 0);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleWhatsApp = (type: 'directo' | 'agradecer' | 'recordar') => {
    if (!client.phone) return;
    const clean = client.phone.replace(/\D/g, '');
    if (!clean) return;
    let msg = '';
    if (type === 'agradecer') {
      msg = `Hola ${client.name}! Gracias por tu compra de hoy. Esperamos que te guste todo. Cualquier cosa, avisanos!`;
    } else if (type === 'recordar') {
      msg = `Hola ${client.name}! Te escribimos de la tienda. Tenemos novedades que te pueden interesar. Pasate cuando quieras!`;
    }
    window.open(`https://wa.me/${clean}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`, '_blank');
  };

  const handleSaveNotes = () => {
    updateClient(clientId, { notes: notesTemp });
    setIsEditingNotes(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    updateClient(clientId, { name: editName, phone: editPhone });
    setIsEditingProfile(false);
  };

  const handleDeleteSale = (sale: Sale) => {
    if (!confirm('¿Eliminar esta venta del historial? Se puede deshacer por 5 segundos.')) return;
    const undo = deleteSale(sale.id);
    showToast('Venta eliminada', undo);
  };

  const handleDeleteClient = () => {
    if (!confirm('¿Eliminar a este cliente y todo su historial? Esta acción se puede deshacer por 5 segundos.')) return;
    const undo = deleteClient(clientId);
    showToast(`Cliente "${client.name}" eliminado`, undo);
    onBack();
  };

  // Payment handlers
  const openRegisterPayment = (sale: Sale) => {
    const paid = getSalePayments(sale.id).reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(0, sale.total - paid);
    setPayingSale(sale);
    setPayAmount(remaining > 0 ? remaining.toString() : '');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayMethod('efectivo');
    setPayObs('');
    setPayError(null);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingSale || !payAmount || isSubmittingPayment) return;
    const amount = Number(payAmount);
    if (isNaN(amount) || amount <= 0) {
      setPayError('Ingresá un monto válido mayor a $0.');
      return;
    }
    const existingPaid = getSalePayments(payingSale.id).reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(0, payingSale.total - existingPaid);
    if (amount > remaining) {
      setPayError(`El monto supera el saldo restante de $${remaining.toLocaleString('es-AR')}.`);
      return;
    }
    setPayError(null);
    setIsSubmittingPayment(true);
    try {
      await addPayment(payingSale.id, { date: payDate, amount, paymentMethod: payMethod, observations: payObs || undefined });
      showToast('Pago registrado', undefined, 'success');
      setPayingSale(null);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleDeletePayment = (payment: Payment, saleId: string) => {
    if (!confirm('¿Eliminar este pago? Se puede deshacer por 5 segundos.')) return;
    const undo = deletePayment(payment.id, saleId);
    showToast('Pago eliminado', undo);
  };

  const openEditPayment = (payment: Payment, saleId: string) => {
    setEditingPayment({ payment, saleId });
    setEditPayDate(payment.date);
    setEditPayAmount(payment.amount.toString());
    setEditPayMethod(payment.paymentMethod);
    setEditPayObs(payment.observations || '');
    setEditPayError(null);
  };

  const handleSaveEditPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    const amount = Number(editPayAmount);
    if (isNaN(amount) || amount <= 0) {
      setEditPayError('Ingresá un monto válido mayor a $0.');
      return;
    }
    const sale = sales.find(s => s.id === editingPayment.saleId);
    if (sale) {
      const otherPaid = getSalePayments(editingPayment.saleId)
        .filter(p => p.id !== editingPayment.payment.id)
        .reduce((s, p) => s + p.amount, 0);
      const maxAllowed = Math.max(0, sale.total - otherPaid);
      if (amount > maxAllowed) {
        setEditPayError(`El monto supera el saldo disponible de $${maxAllowed.toLocaleString('es-AR')}.`);
        return;
      }
    }
    setEditPayError(null);
    updatePayment(editingPayment.payment.id, {
      date: editPayDate,
      amount,
      paymentMethod: editPayMethod,
      observations: editPayObs || undefined,
    }, editingPayment.saleId);
    setEditingPayment(null);
    showToast('Pago actualizado', undefined, 'success');
  };

  return (
    <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg-primary)' }}>
      {/* Nav */}
      <div className="ios-nav" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="ios-btn-text" style={{ padding: 0 }} onClick={onBack}>
          <ChevronLeft size={24} /> Volver
        </button>
        <span style={{ fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em' }}>Perfil</span>
        <button
          className="ios-btn-text"
          style={{ padding: 0, fontSize: 15 }}
          onClick={() => { setEditName(client.name); setEditPhone(client.phone || ''); setIsEditingProfile(true); }}
        >
          Editar
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>
        {/* Profile Header */}
        <div style={{ padding: '28px 16px 24px', textAlign: 'center', background: 'var(--bg-secondary)', borderBottom: '0.5px solid var(--separator-opaque)' }}>
          <div className="ios-avatar lg" style={{
            background: 'linear-gradient(135deg, var(--accent-bg) 0%, rgba(212,160,160,0.2) 100%)',
            color: 'var(--accent-deep)', margin: '0 auto 16px', fontSize: 36,
            boxShadow: '0 4px 16px rgba(212,160,160,0.25)',
          }}>
            {client.name.charAt(0).toUpperCase()}
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
            {client.name}
          </h2>
          {client.preferredSize && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Talle preferido: <strong>{client.preferredSize}</strong>
            </p>
          )}
          {!client.preferredSize && <div style={{ marginBottom: 16 }} />}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <div style={{ background: 'var(--accent-bg)', borderRadius: 14, padding: '12px 24px', minWidth: 84 }}>
              <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{totalCompras}</p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>Compras</p>
            </div>
            {pendingDebt > 0 && (
              <div style={{ background: 'rgba(255,59,48,0.07)', borderRadius: 14, padding: '12px 24px', minWidth: 84 }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#ff3b30', lineHeight: 1 }}>${pendingDebt.toLocaleString('es-AR')}</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>Debe</p>
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Actions */}
        {client.phone && (
          <div style={{ padding: '16px', display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <button onClick={() => handleWhatsApp('directo')} className="ios-btn-secondary" style={{ flexShrink: 0, padding: '8px 14px', fontSize: 13, background: '#25D36615', color: '#25D366', borderColor: '#25D36630', gap: 5 }}>
              <WhatsAppIcon size={14} /> Chatear
            </button>
            <button onClick={() => handleWhatsApp('recordar')} className="ios-btn-secondary" style={{ flexShrink: 0, padding: '8px 14px', fontSize: 13, gap: 5 }}>
              <ClockIcon size={14} /> Recordar
            </button>
            <button onClick={() => handleWhatsApp('agradecer')} className="ios-btn-secondary" style={{ flexShrink: 0, padding: '8px 14px', fontSize: 13, gap: 5 }}>
              <CheckIcon size={14} /> Agradecer
            </button>
          </div>
        )}

        {/* Notes */}
        <div style={{ padding: '24px 16px 8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <p className="ios-section-header" style={{ padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <NoteIcon size={16} /> Notas del Cliente
            </p>
            {!isEditingNotes ? (
              <button className="ios-btn-text" style={{ padding: 0, fontSize: 13 }} onClick={() => { setNotesTemp(client.notes || ''); setIsEditingNotes(true); }}>
                Editar
              </button>
            ) : (
              <button className="ios-btn-text" style={{ padding: 0, fontSize: 13 }} onClick={handleSaveNotes}>
                Guardar
              </button>
            )}
          </div>
          <div className="ios-card" style={{ padding: isEditingNotes ? 0 : 16 }}>
            {isEditingNotes ? (
              <textarea
                value={notesTemp}
                onChange={e => setNotesTemp(e.target.value)}
                placeholder="Talles, preferencias, notas importantes..."
                style={{ width: '100%', border: 'none', padding: 16, fontSize: 15, fontFamily: 'inherit', outline: 'none', resize: 'none', minHeight: 90, background: 'transparent' }}
                autoFocus
              />
            ) : (
              <p style={{ fontSize: 15, color: client.notes ? 'var(--text-primary)' : 'var(--text-tertiary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {client.notes || 'Sin notas registradas.'}
              </p>
            )}
          </div>
        </div>

        {/* History */}
        <p className="ios-section-header">Historial de Compras</p>
        <div style={{ padding: '0 16px' }}>
          {sales.length === 0 ? (
            <div className="ios-empty" style={{ padding: '32px 0' }}>
              <div className="ios-empty-icon"><ShirtIcon size={24} /></div>
              <p>Sin compras registradas.</p>
            </div>
          ) : (
            <div className="history-cards">
              {sales.map(sale => {
                const salePayments = getSalePayments(sale.id);
                const totalPaid = salePayments.reduce((s, p) => s + p.amount, 0);
                const remaining = Math.max(0, sale.total - totalPaid);
                const isPending = sale.paymentStatus === 'pendiente';
                const isPartial = sale.paymentStatus === 'parcial';

                const cardBorder = isPending
                  ? '1px solid #ff3b3040'
                  : isPartial
                  ? '1px solid #ff950040'
                  : 'none';

                return (
                  <div key={sale.id} className="ios-card" style={{ position: 'relative', border: cardBorder, overflow: 'hidden' }}>
                    {/* Header */}
                    <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--separator-opaque)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 5 }}>
                          {formatDate(sale.date)}
                        </p>
                        <PaymentStatusBadge status={sale.paymentStatus} />
                      </div>
                      <button
                        className="ios-btn-icon"
                        style={{ width: 28, height: 28, color: 'var(--text-tertiary)' }}
                        onClick={() => handleDeleteSale(sale)}
                        title="Eliminar"
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>

                    {/* Items list */}
                    <div style={{ padding: '12px 16px 0' }}>
                      {sale.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                              {item.quantity > 1 ? `${item.quantity}× ` : ''}{item.productName}
                            </p>
                            {item.variantInfo && (
                              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.variantInfo}</p>
                            )}
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 600, flexShrink: 0, marginLeft: 12 }}>
                            ${item.subtotal.toLocaleString('es-AR')}
                          </p>
                        </div>
                      ))}

                      {sale.discount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '0.5px solid var(--separator-opaque)' }}>
                          <p style={{ fontSize: 13, color: '#34c759' }}>Descuento</p>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#34c759' }}>-${sale.discount.toLocaleString('es-AR')}</p>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '0.5px solid var(--separator-opaque)', marginBottom: 12 }}>
                        <p style={{ fontSize: 15, fontWeight: 700 }}>Total</p>
                        <p style={{ fontSize: 15, fontWeight: 700 }}>${sale.total.toLocaleString('es-AR')}</p>
                      </div>
                    </div>

                    {/* Payment summary */}
                    {sale.total > 0 && (
                      <div style={{ padding: '0 16px 12px' }}>
                        <div style={{ background: 'var(--bg-tertiary)', borderRadius: 10, padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: 16, marginBottom: salePayments.length > 0 ? 12 : 0 }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Total</p>
                              <p style={{ fontSize: 15, fontWeight: 700 }}>${sale.total.toLocaleString('es-AR')}</p>
                            </div>
                            {totalPaid > 0 && (
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Pagado</p>
                                <p style={{ fontSize: 15, fontWeight: 700, color: '#34c759' }}>${totalPaid.toLocaleString('es-AR')}</p>
                              </div>
                            )}
                            {remaining > 0 && (
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Restante</p>
                                <p style={{ fontSize: 15, fontWeight: 700, color: '#ff3b30' }}>${remaining.toLocaleString('es-AR')}</p>
                              </div>
                            )}
                          </div>

                          {salePayments.length > 0 && (
                            <div>
                              <div style={{ height: '0.5px', background: 'var(--separator-opaque)', marginBottom: 10 }} />
                              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <HistoryIcon size={11} /> Pagos realizados
                              </p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {salePayments.map(payment => (
                                  <div key={payment.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34c759', flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                                        ${payment.amount.toLocaleString('es-AR')}
                                      </span>
                                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 6 }}>
                                        {formatDateShort(payment.date)}
                                      </span>
                                      {payment.observations && (
                                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 6 }}>
                                          · {payment.observations}
                                        </span>
                                      )}
                                    </div>
                                    <PaymentMethodBadge method={payment.paymentMethod} />
                                    <button
                                      onClick={() => openEditPayment(payment, sale.id)}
                                      style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}
                                    >
                                      <EditIcon size={13} />
                                    </button>
                                    <button
                                      onClick={() => handleDeletePayment(payment, sale.id)}
                                      style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', color: '#ff3b3080', display: 'flex' }}
                                    >
                                      <TrashIcon size={13} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{ padding: '0 16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <PaymentMethodBadge method={sale.paymentMethod} />
                      {sale.paymentStatus !== 'pagado' && (
                        <button
                          onClick={() => openRegisterPayment(sale)}
                          className="ios-btn-secondary"
                          style={{ padding: '7px 14px', fontSize: 13, gap: 5, flexShrink: 0 }}
                        >
                          <BanknoteIcon size={14} /> Registrar pago
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Register Payment Sheet */}
      {payingSale && (() => {
        const paidSoFar = getSalePayments(payingSale.id).reduce((s, p) => s + p.amount, 0);
        const remainingBalance = Math.max(0, payingSale.total - paidSoFar);
        const summary = payingSale.items.length === 1
          ? payingSale.items[0].productName
          : `${payingSale.items.length} artículos`;
        return (
          <div className="ios-sheet-backdrop" onClick={e => { if (e.target === e.currentTarget) setPayingSale(null); }}>
            <div className="ios-sheet" style={{ maxHeight: '80dvh', overflowY: 'auto' }}>
              <div className="ios-sheet-handle" />
              <div className="ios-sheet-header">
                <button className="ios-btn-text" style={{ padding: 0 }} onClick={() => setPayingSale(null)}>Cancelar</button>
                <h2>Registrar Pago</h2>
                <div style={{ width: 68 }} />
              </div>
              <div style={{ padding: '4px 16px 12px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{summary}</p>
                <div style={{ display: 'inline-flex', gap: 16, background: 'var(--bg-tertiary)', borderRadius: 10, padding: '8px 16px' }}>
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Total</p>
                    <p style={{ fontSize: 14, fontWeight: 700 }}>${payingSale.total.toLocaleString('es-AR')}</p>
                  </div>
                  {paidSoFar > 0 && (
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Pagado</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#34c759' }}>${paidSoFar.toLocaleString('es-AR')}</p>
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Restante</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#ff3b30' }}>${remainingBalance.toLocaleString('es-AR')}</p>
                  </div>
                </div>
              </div>
              <form onSubmit={handleSubmitPayment} style={{ padding: '8px 16px 16px' }}>
                <div className="ios-input-group" style={{ marginBottom: payError ? 8 : 24 }}>
                  <div className="ios-input-row">
                    <label>Fecha del pago</label>
                    <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} required max={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="ios-input-row">
                    <label>Monto</label>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-tertiary)', marginRight: 4 }}>$</span>
                      <input
                        type="number" placeholder="0" value={payAmount}
                        onChange={e => { setPayAmount(e.target.value); setPayError(null); }}
                        min="1" required autoFocus
                        style={{ flex: 'none', width: '110px', borderColor: payError ? '#ff3b30' : undefined }}
                      />
                    </div>
                  </div>
                  <div className="ios-input-row">
                    <label>Método</label>
                    <select value={payMethod} onChange={e => setPayMethod(e.target.value as PaymentMethod)}>
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                  </div>
                  <div className="ios-input-row" style={{ alignItems: 'flex-start' }}>
                    <label style={{ paddingTop: 8 }}>Nota</label>
                    <textarea value={payObs} onChange={e => setPayObs(e.target.value)} placeholder="Opcional..." style={{ resize: 'none', minHeight: 60 }} />
                  </div>
                </div>
                {payError && (
                  <p style={{ fontSize: 13, color: '#ff3b30', marginBottom: 16, padding: '8px 12px', background: '#ff3b3010', borderRadius: 8 }}>
                    {payError}
                  </p>
                )}
                <button type="submit" className="ios-btn-primary" style={{ marginBottom: 8 }} disabled={isSubmittingPayment}>
                  {isSubmittingPayment ? 'Guardando...' : 'Confirmar Pago'}
                </button>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Edit Payment Sheet */}
      {editingPayment && (
        <div className="ios-sheet-backdrop" onClick={e => { if (e.target === e.currentTarget) setEditingPayment(null); }}>
          <div className="ios-sheet" style={{ maxHeight: '80dvh', overflowY: 'auto' }}>
            <div className="ios-sheet-handle" />
            <div className="ios-sheet-header">
              <button className="ios-btn-text" style={{ padding: 0 }} onClick={() => setEditingPayment(null)}>Cancelar</button>
              <h2>Editar Pago</h2>
              <div style={{ width: 68 }} />
            </div>
            <form onSubmit={handleSaveEditPayment} style={{ padding: '16px' }}>
              <div className="ios-input-group" style={{ marginBottom: editPayError ? 8 : 24 }}>
                <div className="ios-input-row">
                  <label>Fecha del pago</label>
                  <input type="date" value={editPayDate} onChange={e => setEditPayDate(e.target.value)} required max={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="ios-input-row">
                  <label>Monto</label>
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                    <span style={{ color: 'var(--text-tertiary)', marginRight: 4 }}>$</span>
                    <input
                      type="number" placeholder="0" value={editPayAmount}
                      onChange={e => { setEditPayAmount(e.target.value); setEditPayError(null); }}
                      min="1" required
                      style={{ flex: 'none', width: '110px', borderColor: editPayError ? '#ff3b30' : undefined }}
                    />
                  </div>
                </div>
                <div className="ios-input-row">
                  <label>Método</label>
                  <select value={editPayMethod} onChange={e => setEditPayMethod(e.target.value as PaymentMethod)}>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
                <div className="ios-input-row" style={{ alignItems: 'flex-start' }}>
                  <label style={{ paddingTop: 8 }}>Nota</label>
                  <textarea value={editPayObs} onChange={e => setEditPayObs(e.target.value)} placeholder="Opcional..." style={{ resize: 'none', minHeight: 60 }} />
                </div>
              </div>
              {editPayError && (
                <p style={{ fontSize: 13, color: '#ff3b30', marginBottom: 16, padding: '8px 12px', background: '#ff3b3010', borderRadius: 8 }}>
                  {editPayError}
                </p>
              )}
              <button type="submit" className="ios-btn-primary" style={{ marginBottom: 8 }}>
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Sheet */}
      {isEditingProfile && (
        <div className="ios-sheet-backdrop" onClick={e => { if (e.target === e.currentTarget) setIsEditingProfile(false); }}>
          <div className="ios-sheet">
            <div className="ios-sheet-handle" />
            <div className="ios-sheet-header">
              <button className="ios-btn-text" style={{ padding: 0, opacity: 0, pointerEvents: 'none' }}>_</button>
              <h2>Editar Cliente</h2>
              <button className="ios-btn-text" style={{ padding: 0 }} onClick={() => setIsEditingProfile(false)}>
                Cancelar
              </button>
            </div>
            <form onSubmit={handleSaveProfile} style={{ padding: '16px' }}>
              <div className="ios-input-group" style={{ marginBottom: 24 }}>
                <div className="ios-input-row">
                  <label>Nombre</label>
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required autoFocus />
                </div>
                <div className="ios-input-row">
                  <label>Teléfono</label>
                  <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Ej: 11 1234-5678" />
                </div>
              </div>
              <button type="submit" className="ios-btn-primary" style={{ marginBottom: 16 }}>
                Guardar Cambios
              </button>
              <button
                type="button"
                onClick={handleDeleteClient}
                style={{ width: '100%', padding: '14px', background: 'transparent', color: 'var(--danger)', border: 'none', fontSize: 17, fontWeight: 500, cursor: 'pointer' }}
              >
                Eliminar Cliente
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
