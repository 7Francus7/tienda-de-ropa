'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import {
  Client, ProductWithVariants, ProductVariant, Sale, Payment,
  Expense, Purchase, PaymentMethod, PaymentStatus, CartItem,
  ExpenseCategory,
} from '@/types';
import {
  getDbClients, addDbClient, updateDbClient, deleteDbClient,
  getDbProducts, addDbProduct, updateDbProduct, deleteDbProduct,
  addDbVariant, updateDbVariant, deleteDbVariant,
  getDbSales, addDbSale, deleteDbSale,
  getDbAllPayments, addDbPayment, deleteDbPayment, updateDbPayment,
  getDbExpenses, addDbExpense, deleteDbExpense,
  getDbPurchases, addDbPurchase, deleteDbPurchase,
  adjustDbVariantStock,
} from '@/actions/dbActions';
import type { Product } from '@/types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function loadStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function replaceOptimistic<T extends { id: string }>(items: T[], tmpId: string, real: T): T[] {
  return items.map(i => (i.id === tmpId ? real : i));
}

const KEYS = {
  clients: 'tienda_clients_v1',
  products: 'tienda_products_v1',
  sales: 'tienda_sales_v1',
  payments: 'tienda_payments_v1',
  expenses: 'tienda_expenses_v1',
  purchases: 'tienda_purchases_v1',
  theme: 'tienda_theme',
};

const UNDO_DELAY = 5000;

interface StoreContextType {
  // Clients
  clients: Client[];
  addClient: (data: { name: string; phone?: string; notes?: string; preferredSize?: string; preferences?: string }) => Promise<Client>;
  updateClient: (id: string, data: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteClient: (id: string) => () => void;
  getClient: (id: string) => Client | undefined;
  searchClients: (query: string) => Client[];

  // Products + Variants
  products: ProductWithVariants[];
  addProduct: (data: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>) => void;
  deleteProduct: (id: string) => () => void;
  addVariant: (data: Omit<ProductVariant, 'id' | 'createdAt'>) => Promise<void>;
  updateVariant: (id: string, productId: string, data: Partial<Omit<ProductVariant, 'id' | 'productId' | 'createdAt'>>) => void;
  deleteVariant: (id: string, productId: string) => () => void;
  adjustVariantStock: (variantId: string, productId: string, newStock: number, reason?: string) => Promise<void>;

  // Sales
  sales: Sale[];
  addSale: (data: {
    clientId: string;
    date: string;
    items: CartItem[];
    discount: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    observations?: string;
    initialPaymentAmount?: number;
  }) => Promise<void>;
  deleteSale: (id: string) => () => void;
  getClientSales: (clientId: string) => Sale[];
  getRecentSales: (limit?: number) => Sale[];

  // Payments
  payments: Payment[];
  addPayment: (saleId: string, data: { date: string; amount: number; paymentMethod: PaymentMethod; observations?: string }) => Promise<void>;
  deletePayment: (paymentId: string, saleId: string) => () => void;
  updatePayment: (paymentId: string, data: { date?: string; amount?: number; paymentMethod?: PaymentMethod; observations?: string }, saleId: string) => void;
  getSalePayments: (saleId: string) => Payment[];

  // Expenses
  expenses: Expense[];
  addExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => () => void;

  // Purchases
  purchases: Purchase[];
  addPurchase: (data: {
    supplierName?: string;
    date: string;
    notes?: string;
    items: Array<{ variantId?: string; productName: string; variantInfo?: string; quantity: number; unitCost: number }>;
  }) => Promise<void>;
  deletePurchase: (id: string) => () => void;

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // State
  isLoaded: boolean;
  syncError: boolean;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(() => loadStored<Client[]>(KEYS.clients, []));
  const [products, setProducts] = useState<ProductWithVariants[]>(() => loadStored<ProductWithVariants[]>(KEYS.products, []));
  const [sales, setSales] = useState<Sale[]>(() => loadStored<Sale[]>(KEYS.sales, []));
  const [payments, setPayments] = useState<Payment[]>(() => loadStored<Payment[]>(KEYS.payments, []));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadStored<Expense[]>(KEYS.expenses, []));
  const [purchases, setPurchases] = useState<Purchase[]>(() => loadStored<Purchase[]>(KEYS.purchases, []));
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const isLoaded = true;

  const undoTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  function scheduleDelete(id: string, fn: () => void) {
    const t = setTimeout(() => { fn(); undoTimers.current.delete(id); }, UNDO_DELAY);
    undoTimers.current.set(id, t);
  }
  function cancelDelete(id: string) {
    const t = undoTimers.current.get(id);
    if (t) { clearTimeout(t); undoTimers.current.delete(id); }
  }

  // Theme
  useEffect(() => { document.documentElement.classList.toggle('dark', isDarkMode); }, [isDarkMode]);
  useEffect(() => {
    queueMicrotask(() => {
      const saved = localStorage.getItem(KEYS.theme);
      const dark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDarkMode(dark);
      document.documentElement.classList.toggle('dark', dark);
    });
  }, []);

  // DB sync on mount
  useEffect(() => {
    const sync = async () => {
      try {
        const [dbC, dbP, dbS, dbPay, dbE, dbPur] = await Promise.all([
          getDbClients(),
          getDbProducts(),
          getDbSales(),
          getDbAllPayments(),
          getDbExpenses(),
          getDbPurchases(),
        ]);
        setClients(dbC);
        setProducts(dbP);
        setSales(dbS);
        setPayments(dbPay);
        setExpenses(dbE);
        setPurchases(dbPur);
        setSyncError(false);
      } catch (e) {
        console.warn('Offline mode', e);
        setSyncError(true);
      }
    };
    sync();
  }, []);

  // Persistence
  useEffect(() => { localStorage.setItem(KEYS.clients, JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem(KEYS.products, JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem(KEYS.sales, JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem(KEYS.payments, JSON.stringify(payments)); }, [payments]);
  useEffect(() => { localStorage.setItem(KEYS.expenses, JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem(KEYS.purchases, JSON.stringify(purchases)); }, [purchases]);

  // --- Clients ---
  const addClient = useCallback(async (data: { name: string; phone?: string; notes?: string; preferredSize?: string; preferences?: string }): Promise<Client> => {
    const now = new Date().toISOString();
    const tmp: Client = { id: generateId(), ...data, name: data.name.trim(), createdAt: now, updatedAt: now };
    setClients(prev => [tmp, ...prev]);
    try {
      const real = await addDbClient(data);
      setClients(prev => replaceOptimistic(prev, tmp.id, real));
      setSales(prev => prev.map(s => s.clientId === tmp.id ? { ...s, clientId: real.id } : s));
      return real;
    } catch {
      return tmp;
    }
  }, []);

  const updateClient = useCallback((id: string, data: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c));
    updateDbClient(id, data as Parameters<typeof updateDbClient>[1]);
  }, []);

  const deleteClient = useCallback((id: string): (() => void) => {
    const client = clients.find(c => c.id === id);
    const clientSales = sales.filter(s => s.clientId === id);
    const saleIds = new Set(clientSales.map(s => s.id));
    const clientPayments = payments.filter(p => saleIds.has(p.saleId));

    setClients(prev => prev.filter(c => c.id !== id));
    setSales(prev => prev.filter(s => s.clientId !== id));
    setPayments(prev => prev.filter(p => !saleIds.has(p.saleId)));
    scheduleDelete(id, () => deleteDbClient(id));

    return () => {
      cancelDelete(id);
      if (client) setClients(prev => [client, ...prev]);
      if (clientSales.length) setSales(prev => [...prev, ...clientSales]);
      if (clientPayments.length) setPayments(prev => [...prev, ...clientPayments]);
    };
  }, [clients, sales, payments]);

  const getClient = useCallback((id: string) => clients.find(c => c.id === id), [clients]);
  const searchClients = useCallback((query: string) => {
    const q = query.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(c => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)));
  }, [clients]);

  // --- Products ---
  const addProduct = useCallback(async (data: Omit<Product, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const tmp: ProductWithVariants = {
      id: generateId(),
      ...data,
      createdAt: now,
      variants: [],
    };
    setProducts(prev => [tmp, ...prev]);
    try {
      const real = await addDbProduct(data);
      setProducts(prev => prev.map(p => p.id === tmp.id ? { ...real, variants: [] } : p));
    } catch {
      // DB unavailable — keep optimistic local record
    }
  }, []);

  const updateProduct = useCallback((id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    updateDbProduct(id, data);
  }, []);

  const deleteProduct = useCallback((id: string): (() => void) => {
    const product = products.find(p => p.id === id);
    setProducts(prev => prev.filter(p => p.id !== id));
    scheduleDelete(id, () => deleteDbProduct(id));
    return () => {
      cancelDelete(id);
      if (product) setProducts(prev => [product, ...prev]);
    };
  }, [products]);

  const addVariant = useCallback(async (data: Omit<ProductVariant, 'id' | 'createdAt'>) => {
    const real = await addDbVariant(data);
    setProducts(prev => prev.map(p =>
      p.id === data.productId ? { ...p, variants: [...p.variants, real] } : p
    ));
  }, []);

  const updateVariant = useCallback((id: string, productId: string, data: Partial<Omit<ProductVariant, 'id' | 'productId' | 'createdAt'>>) => {
    setProducts(prev => prev.map(p =>
      p.id === productId
        ? { ...p, variants: p.variants.map(v => v.id === id ? { ...v, ...data } : v) }
        : p
    ));
    updateDbVariant(id, data);
  }, []);

  const deleteVariant = useCallback((id: string, productId: string): (() => void) => {
    const product = products.find(p => p.id === productId);
    const variant = product?.variants.find(v => v.id === id);
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, variants: p.variants.filter(v => v.id !== id) } : p
    ));
    scheduleDelete(id, () => deleteDbVariant(id));
    return () => {
      cancelDelete(id);
      if (variant) {
        setProducts(prev => prev.map(p =>
          p.id === productId ? { ...p, variants: [...p.variants, variant] } : p
        ));
      }
    };
  }, [products]);

  const adjustVariantStock = useCallback(async (variantId: string, productId: string, newStock: number, reason?: string) => {
    setProducts(prev => prev.map(p =>
      p.id === productId
        ? { ...p, variants: p.variants.map(v => v.id === variantId ? { ...v, stock: Math.max(0, newStock) } : v) }
        : p
    ));
    await adjustDbVariantStock(variantId, newStock, reason);
  }, []);

  // --- Sales ---
  const addSale = useCallback(async (data: Parameters<StoreContextType['addSale']>[0]) => {
    const { sale, newPayment } = await addDbSale(data);
    setSales(prev => [sale, ...prev]);
    if (newPayment) setPayments(prev => [newPayment, ...prev]);
    // Refresh products to get updated stock
    getDbProducts().then(setProducts).catch(() => {});
  }, []);

  const deleteSale = useCallback((id: string): (() => void) => {
    const sale = sales.find(s => s.id === id);
    const salePayments = payments.filter(p => p.saleId === id);
    setSales(prev => prev.filter(s => s.id !== id));
    setPayments(prev => prev.filter(p => p.saleId !== id));
    scheduleDelete(id, () => deleteDbSale(id));
    return () => {
      cancelDelete(id);
      if (sale) setSales(prev => [...prev, sale].sort((a, b) => b.date.localeCompare(a.date)));
      if (salePayments.length) setPayments(prev => [...prev, ...salePayments]);
    };
  }, [sales, payments]);

  const getClientSales = useCallback((clientId: string) => {
    return [...sales.filter(s => s.clientId === clientId)].sort((a, b) => b.date.localeCompare(a.date));
  }, [sales]);

  const getRecentSales = useCallback((limit = 20) => {
    return [...sales].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
  }, [sales]);

  // --- Payments ---
  const addPayment = useCallback(async (saleId: string, data: { date: string; amount: number; paymentMethod: PaymentMethod; observations?: string }) => {
    const { payment, newStatus } = await addDbPayment({ saleId, ...data });
    setPayments(prev => [payment, ...prev]);
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, paymentStatus: newStatus } : s));
  }, []);

  const deletePayment = useCallback((paymentId: string, saleId: string): (() => void) => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return () => {};

    const sale = sales.find(s => s.id === saleId);
    const afterPmts = payments.filter(p => p.saleId === saleId && p.id !== paymentId);
    const paidTotal = afterPmts.reduce((s, p) => s + p.amount, 0);
    const saleTotal = sale?.total ?? 0;
    const optimisticStatus: PaymentStatus =
      saleTotal === 0 ? 'pagado'
      : paidTotal <= 0 ? 'pendiente'
      : paidTotal >= saleTotal ? 'pagado'
      : 'parcial';

    setPayments(prev => prev.filter(p => p.id !== paymentId));
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, paymentStatus: optimisticStatus } : s));

    scheduleDelete(paymentId, () =>
      deleteDbPayment(paymentId, saleId).then(({ newStatus }) =>
        setSales(prev => prev.map(s => s.id === saleId ? { ...s, paymentStatus: newStatus } : s))
      )
    );

    return () => {
      cancelDelete(paymentId);
      setPayments(prev => [payment, ...prev]);
      if (sale) setSales(prev => prev.map(s => s.id === saleId ? { ...s, paymentStatus: sale.paymentStatus } : s));
    };
  }, [payments, sales]);

  const updatePayment = useCallback((paymentId: string, data: { date?: string; amount?: number; paymentMethod?: PaymentMethod; observations?: string }, saleId: string) => {
    setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, ...data } : p));
    updateDbPayment(paymentId, data, saleId).then(({ newStatus }) =>
      setSales(prev => prev.map(s => s.id === saleId ? { ...s, paymentStatus: newStatus } : s))
    );
  }, []);

  const getSalePayments = useCallback((saleId: string) => {
    return payments.filter(p => p.saleId === saleId).sort((a, b) => a.date.localeCompare(b.date));
  }, [payments]);

  // --- Expenses ---
  const addExpense = useCallback((data: Omit<Expense, 'id' | 'createdAt'>) => {
    const tmp: Expense = { id: generateId(), createdAt: new Date().toISOString(), ...data };
    setExpenses(prev => [tmp, ...prev]);
    addDbExpense(data).then(real => setExpenses(prev => replaceOptimistic(prev, tmp.id, real)));
  }, []);

  const deleteExpense = useCallback((id: string): (() => void) => {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return () => {};
    setExpenses(prev => prev.filter(e => e.id !== id));
    scheduleDelete(id, () => deleteDbExpense(id));
    return () => {
      cancelDelete(id);
      setExpenses(prev => [...prev, expense].sort((a, b) => b.date.localeCompare(a.date)));
    };
  }, [expenses]);

  // --- Purchases ---
  const addPurchase = useCallback(async (data: Parameters<StoreContextType['addPurchase']>[0]) => {
    const { purchase } = await addDbPurchase(data);
    setPurchases(prev => [purchase, ...prev]);
    // Refresh products to get updated stock
    getDbProducts().then(setProducts).catch(() => {});
  }, []);

  const deletePurchase = useCallback((id: string): (() => void) => {
    const purchase = purchases.find(p => p.id === id);
    setPurchases(prev => prev.filter(p => p.id !== id));
    scheduleDelete(id, () => deleteDbPurchase(id));
    return () => {
      cancelDelete(id);
      if (purchase) setPurchases(prev => [purchase, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    };
  }, [purchases]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem(KEYS.theme, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return (
    <StoreContext.Provider value={{
      clients, addClient, updateClient, deleteClient, getClient, searchClients,
      products, addProduct, updateProduct, deleteProduct, addVariant, updateVariant, deleteVariant, adjustVariantStock,
      sales, addSale, deleteSale, getClientSales, getRecentSales,
      payments, addPayment, deletePayment, updatePayment, getSalePayments,
      expenses, addExpense, deleteExpense,
      purchases, addPurchase, deletePurchase,
      isDarkMode, toggleDarkMode,
      isLoaded, syncError,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
