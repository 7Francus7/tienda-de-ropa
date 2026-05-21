'use server';

import { db } from '@/db';
import {
  clients, products, productVariants, stockMovements,
  sales, saleItems, payments, expenses, purchases, purchaseItems,
} from '@/db/schema';
import { eq, desc, inArray, asc } from 'drizzle-orm';
import {
  Client, Product, ProductVariant, ProductWithVariants, StockMovement,
  Sale, SaleItem, Payment, PaymentMethod, PaymentStatus,
  Expense, ExpenseCategory, Purchase, PurchaseItem, CartItem,
} from '@/types';

// =======================
// Clients
// =======================
export async function getDbClients(): Promise<Client[]> {
  const result = await db.select().from(clients).orderBy(desc(clients.createdAt));
  return result.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone || undefined,
    notes: c.notes || undefined,
    preferredSize: c.preferredSize || undefined,
    preferences: c.preferences || undefined,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
}

export async function addDbClient(data: {
  name: string;
  phone?: string;
  notes?: string;
  preferredSize?: string;
  preferences?: string;
}): Promise<Client> {
  const [row] = await db.insert(clients).values(data).returning();
  return {
    id: row.id,
    name: row.name,
    phone: row.phone || undefined,
    notes: row.notes || undefined,
    preferredSize: row.preferredSize || undefined,
    preferences: row.preferences || undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function updateDbClient(
  id: string,
  data: Partial<{ name: string; phone: string; notes: string; preferredSize: string; preferences: string }>,
) {
  await db.update(clients).set({ ...data, updatedAt: new Date() }).where(eq(clients.id, id));
}

export async function deleteDbClient(id: string) {
  await db.delete(clients).where(eq(clients.id, id));
}

// =======================
// Products + Variants
// =======================
function mapProduct(p: typeof products.$inferSelect): Product {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    brand: p.brand || undefined,
    description: p.description || undefined,
    salePrice: Number(p.salePrice),
    cost: p.cost ? Number(p.cost) : undefined,
    sku: p.sku || undefined,
    barcode: p.barcode || undefined,
    status: (p.status as 'active' | 'archived'),
    images: p.images ? JSON.parse(p.images) : undefined,
    createdAt: p.createdAt.toISOString(),
  };
}

function mapVariant(v: typeof productVariants.$inferSelect): ProductVariant {
  return {
    id: v.id,
    productId: v.productId,
    size: v.size || undefined,
    color: v.color || undefined,
    sku: v.sku || undefined,
    stock: v.stock,
    minStock: v.minStock,
    location: v.location || undefined,
    createdAt: v.createdAt.toISOString(),
  };
}

export async function getDbProducts(): Promise<ProductWithVariants[]> {
  const [prods, vars] = await Promise.all([
    db.select().from(products).orderBy(asc(products.name)),
    db.select().from(productVariants).orderBy(asc(productVariants.createdAt)),
  ]);
  return prods.map(p => ({
    ...mapProduct(p),
    variants: vars.filter(v => v.productId === p.id).map(mapVariant),
  }));
}

export async function addDbProduct(data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  const [row] = await db.insert(products).values({
    name: data.name,
    category: data.category,
    brand: data.brand,
    description: data.description,
    salePrice: data.salePrice.toString(),
    cost: data.cost?.toString(),
    sku: data.sku,
    barcode: data.barcode,
    status: data.status,
    images: data.images ? JSON.stringify(data.images) : null,
  }).returning();
  return mapProduct(row);
}

export async function updateDbProduct(id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>) {
  await db.update(products).set({
    name: data.name,
    category: data.category,
    brand: data.brand,
    description: data.description,
    salePrice: data.salePrice?.toString(),
    cost: data.cost?.toString(),
    sku: data.sku,
    barcode: data.barcode,
    status: data.status,
    images: data.images ? JSON.stringify(data.images) : undefined,
  }).where(eq(products.id, id));
}

export async function deleteDbProduct(id: string) {
  await db.delete(products).where(eq(products.id, id));
}

export async function addDbVariant(data: Omit<ProductVariant, 'id' | 'createdAt'>): Promise<ProductVariant> {
  const [row] = await db.insert(productVariants).values({
    productId: data.productId,
    size: data.size,
    color: data.color,
    sku: data.sku,
    stock: data.stock,
    minStock: data.minStock,
    location: data.location,
  }).returning();
  return mapVariant(row);
}

export async function updateDbVariant(id: string, data: Partial<Omit<ProductVariant, 'id' | 'productId' | 'createdAt'>>) {
  await db.update(productVariants).set({
    size: data.size,
    color: data.color,
    sku: data.sku,
    stock: data.stock,
    minStock: data.minStock,
    location: data.location,
  }).where(eq(productVariants.id, id));
}

export async function deleteDbVariant(id: string) {
  await db.delete(productVariants).where(eq(productVariants.id, id));
}

// =======================
// Stock Movements
// =======================
function mapMovement(m: typeof stockMovements.$inferSelect): StockMovement {
  return {
    id: m.id,
    variantId: m.variantId,
    type: m.type as StockMovement['type'],
    quantity: m.quantity,
    reason: m.reason || undefined,
    notes: m.notes || undefined,
    referenceId: m.referenceId || undefined,
    date: m.date,
    createdAt: m.createdAt.toISOString(),
  };
}

export async function getDbStockMovements(variantId?: string): Promise<StockMovement[]> {
  const result = variantId
    ? await db.select().from(stockMovements).where(eq(stockMovements.variantId, variantId)).orderBy(desc(stockMovements.date))
    : await db.select().from(stockMovements).orderBy(desc(stockMovements.date));
  return result.map(mapMovement);
}

export async function addDbStockMovement(data: Omit<StockMovement, 'id' | 'createdAt'>): Promise<StockMovement> {
  const [row] = await db.insert(stockMovements).values({
    variantId: data.variantId,
    type: data.type,
    quantity: data.quantity,
    reason: data.reason,
    notes: data.notes,
    referenceId: data.referenceId,
    date: data.date,
  }).returning();

  // Apply stock change
  const current = await db.select({ stock: productVariants.stock }).from(productVariants).where(eq(productVariants.id, data.variantId));
  if (current[0]) {
    const newStock = Math.max(0, current[0].stock + data.quantity);
    await db.update(productVariants).set({ stock: newStock }).where(eq(productVariants.id, data.variantId));
  }

  return mapMovement(row);
}

export async function adjustDbVariantStock(
  variantId: string,
  newStock: number,
  reason?: string,
  date?: string,
): Promise<{ movement: StockMovement; newStock: number }> {
  const [current] = await db.select({ stock: productVariants.stock }).from(productVariants).where(eq(productVariants.id, variantId));
  const currentStock = current?.stock ?? 0;
  const diff = newStock - currentStock;

  await db.update(productVariants).set({ stock: Math.max(0, newStock) }).where(eq(productVariants.id, variantId));

  const [row] = await db.insert(stockMovements).values({
    variantId,
    type: 'ajuste',
    quantity: diff,
    reason: reason || 'Ajuste manual',
    date: date ?? new Date().toISOString().split('T')[0],
  }).returning();

  return { movement: mapMovement(row), newStock: Math.max(0, newStock) };
}

// =======================
// Sales
// =======================
function mapSaleItem(s: typeof saleItems.$inferSelect): SaleItem {
  return {
    id: s.id,
    saleId: s.saleId,
    variantId: s.variantId || undefined,
    productName: s.productName,
    variantInfo: s.variantInfo || undefined,
    quantity: s.quantity,
    unitPrice: Number(s.unitPrice),
    subtotal: Number(s.subtotal),
    createdAt: s.createdAt.toISOString(),
  };
}

export async function getDbSales(): Promise<Sale[]> {
  const [salesRows, itemsRows] = await Promise.all([
    db.select().from(sales).orderBy(desc(sales.date)),
    db.select().from(saleItems).orderBy(asc(saleItems.createdAt)),
  ]);
  return salesRows.map(s => ({
    id: s.id,
    clientId: s.clientId,
    date: s.date,
    subtotal: Number(s.subtotal),
    discount: Number(s.discount ?? 0),
    total: Number(s.total),
    paymentMethod: s.paymentMethod as PaymentMethod,
    paymentStatus: s.paymentStatus as PaymentStatus,
    observations: s.observations || undefined,
    items: itemsRows.filter(i => i.saleId === s.id).map(mapSaleItem),
    createdAt: s.createdAt.toISOString(),
  }));
}

export async function addDbSale(data: {
  clientId: string;
  date: string;
  items: CartItem[];
  discount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  observations?: string;
  initialPaymentAmount?: number;
}): Promise<{ sale: Sale; newPayment?: Payment }> {
  const subtotal = data.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const total = Math.max(0, subtotal - data.discount);

  const [saleRow] = await db.insert(sales).values({
    clientId: data.clientId,
    date: data.date,
    subtotal: subtotal.toString(),
    discount: data.discount.toString(),
    total: total.toString(),
    paymentMethod: data.paymentMethod,
    paymentStatus: data.paymentStatus,
    observations: data.observations || null,
  }).returning();

  const itemRows = await Promise.all(
    data.items.map(item =>
      db.insert(saleItems).values({
        saleId: saleRow.id,
        variantId: item.variantId || null,
        productName: item.productName,
        variantInfo: item.variantInfo || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        subtotal: (item.unitPrice * item.quantity).toString(),
      }).returning()
    )
  );

  // Decrement stock + create stock movements for variants
  for (const item of data.items) {
    if (item.variantId) {
      const [current] = await db.select({ stock: productVariants.stock }).from(productVariants).where(eq(productVariants.id, item.variantId));
      if (current) {
        const newStock = Math.max(0, current.stock - item.quantity);
        await db.update(productVariants).set({ stock: newStock }).where(eq(productVariants.id, item.variantId));
        await db.insert(stockMovements).values({
          variantId: item.variantId,
          type: 'venta',
          quantity: -item.quantity,
          reason: 'Venta',
          referenceId: saleRow.id,
          date: data.date,
        });
      }
    }
  }

  const sale: Sale = {
    id: saleRow.id,
    clientId: saleRow.clientId,
    date: saleRow.date,
    subtotal,
    discount: data.discount,
    total,
    paymentMethod: data.paymentMethod,
    paymentStatus: data.paymentStatus,
    observations: data.observations,
    items: itemRows.map(r => mapSaleItem(r[0])),
    createdAt: saleRow.createdAt.toISOString(),
  };

  let newPayment: Payment | undefined;
  const payAmount = data.paymentStatus === 'pagado' ? total
    : data.paymentStatus === 'parcial' && data.initialPaymentAmount ? data.initialPaymentAmount
    : 0;

  if (payAmount > 0) {
    const [payRow] = await db.insert(payments).values({
      saleId: saleRow.id,
      date: data.date,
      amount: payAmount.toString(),
      paymentMethod: data.paymentMethod,
    }).returning();

    if (data.paymentStatus === 'parcial') {
      const newStatus = await recalculateSaleStatus(saleRow.id);
      sale.paymentStatus = newStatus;
    }

    newPayment = {
      id: payRow.id,
      saleId: payRow.saleId,
      date: payRow.date,
      amount: Number(payRow.amount),
      paymentMethod: payRow.paymentMethod as PaymentMethod,
      observations: payRow.observations || undefined,
      createdAt: payRow.createdAt.toISOString(),
    };
  }

  return { sale, newPayment };
}

export async function deleteDbSale(id: string) {
  await db.delete(sales).where(eq(sales.id, id));
}

// =======================
// Payments
// =======================
async function recalculateSaleStatus(saleId: string): Promise<PaymentStatus> {
  const [sale] = await db.select({ total: sales.total }).from(sales).where(eq(sales.id, saleId));
  if (!sale) return 'pendiente';

  const totalAmount = Number(sale.total);
  if (totalAmount === 0) {
    await db.update(sales).set({ paymentStatus: 'pagado' }).where(eq(sales.id, saleId));
    return 'pagado';
  }

  const paymentsResult = await db.select({ amount: payments.amount }).from(payments).where(eq(payments.saleId, saleId));
  const totalPaid = paymentsResult.reduce((s, p) => s + Number(p.amount), 0);

  let status: PaymentStatus;
  if (totalPaid <= 0) status = 'pendiente';
  else if (totalPaid >= totalAmount) status = 'pagado';
  else status = 'parcial';

  await db.update(sales).set({ paymentStatus: status }).where(eq(sales.id, saleId));
  return status;
}

export async function getDbAllPayments(): Promise<Payment[]> {
  const result = await db.select().from(payments).orderBy(desc(payments.date));
  return result.map(p => ({
    id: p.id,
    saleId: p.saleId,
    date: p.date,
    amount: Number(p.amount),
    paymentMethod: p.paymentMethod as PaymentMethod,
    observations: p.observations || undefined,
    createdAt: p.createdAt.toISOString(),
  }));
}

export async function addDbPayment(data: {
  saleId: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  observations?: string;
}): Promise<{ payment: Payment; newStatus: PaymentStatus }> {
  const [row] = await db.insert(payments).values({
    saleId: data.saleId,
    date: data.date,
    amount: data.amount.toString(),
    paymentMethod: data.paymentMethod,
    observations: data.observations || null,
  }).returning();

  const newStatus = await recalculateSaleStatus(data.saleId);

  return {
    payment: {
      id: row.id,
      saleId: row.saleId,
      date: row.date,
      amount: Number(row.amount),
      paymentMethod: row.paymentMethod as PaymentMethod,
      observations: row.observations || undefined,
      createdAt: row.createdAt.toISOString(),
    },
    newStatus,
  };
}

export async function deleteDbPayment(
  paymentId: string,
  saleId: string,
): Promise<{ newStatus: PaymentStatus }> {
  await db.delete(payments).where(eq(payments.id, paymentId));
  const newStatus = await recalculateSaleStatus(saleId);
  return { newStatus };
}

export async function updateDbPayment(
  paymentId: string,
  data: { date?: string; amount?: number; paymentMethod?: PaymentMethod; observations?: string },
  saleId: string,
): Promise<{ newStatus: PaymentStatus }> {
  await db.update(payments).set({
    date: data.date,
    amount: data.amount !== undefined ? data.amount.toString() : undefined,
    paymentMethod: data.paymentMethod,
    observations: data.observations,
  }).where(eq(payments.id, paymentId));
  const newStatus = await recalculateSaleStatus(saleId);
  return { newStatus };
}

// =======================
// Expenses
// =======================
export async function getDbExpenses(): Promise<Expense[]> {
  const result = await db.select().from(expenses).orderBy(desc(expenses.date));
  return result.map(e => ({
    id: e.id,
    date: e.date,
    description: e.description,
    amount: Number(e.amount),
    category: e.category as ExpenseCategory,
    createdAt: e.createdAt.toISOString(),
  }));
}

export async function addDbExpense(data: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
  const [row] = await db.insert(expenses).values({
    ...data,
    amount: data.amount.toString(),
  }).returning();
  return {
    id: row.id,
    date: row.date,
    description: row.description,
    amount: Number(row.amount),
    category: row.category as ExpenseCategory,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function deleteDbExpense(id: string) {
  await db.delete(expenses).where(eq(expenses.id, id));
}

// =======================
// Purchases
// =======================
function mapPurchaseItem(p: typeof purchaseItems.$inferSelect): PurchaseItem {
  return {
    id: p.id,
    purchaseId: p.purchaseId,
    variantId: p.variantId || undefined,
    productName: p.productName,
    variantInfo: p.variantInfo || undefined,
    quantity: p.quantity,
    unitCost: Number(p.unitCost),
    subtotal: Number(p.subtotal),
    createdAt: p.createdAt.toISOString(),
  };
}

export async function getDbPurchases(): Promise<Purchase[]> {
  const [purchaseRows, itemRows] = await Promise.all([
    db.select().from(purchases).orderBy(desc(purchases.date)),
    db.select().from(purchaseItems).orderBy(asc(purchaseItems.createdAt)),
  ]);
  return purchaseRows.map(p => ({
    id: p.id,
    supplierName: p.supplierName || undefined,
    date: p.date,
    totalCost: Number(p.totalCost),
    notes: p.notes || undefined,
    items: itemRows.filter(i => i.purchaseId === p.id).map(mapPurchaseItem),
    createdAt: p.createdAt.toISOString(),
  }));
}

export async function addDbPurchase(data: {
  supplierName?: string;
  date: string;
  notes?: string;
  items: Array<{
    variantId?: string;
    productName: string;
    variantInfo?: string;
    quantity: number;
    unitCost: number;
  }>;
}): Promise<{ purchase: Purchase }> {
  const totalCost = data.items.reduce((s, i) => s + i.unitCost * i.quantity, 0);

  const [purchaseRow] = await db.insert(purchases).values({
    supplierName: data.supplierName || null,
    date: data.date,
    totalCost: totalCost.toString(),
    notes: data.notes || null,
  }).returning();

  const itemRows = await Promise.all(
    data.items.map(item =>
      db.insert(purchaseItems).values({
        purchaseId: purchaseRow.id,
        variantId: item.variantId || null,
        productName: item.productName,
        variantInfo: item.variantInfo || null,
        quantity: item.quantity,
        unitCost: item.unitCost.toString(),
        subtotal: (item.unitCost * item.quantity).toString(),
      }).returning()
    )
  );

  // Increment stock + create stock movements
  for (const item of data.items) {
    if (item.variantId) {
      const [current] = await db.select({ stock: productVariants.stock }).from(productVariants).where(eq(productVariants.id, item.variantId));
      if (current) {
        const newStock = current.stock + item.quantity;
        await db.update(productVariants).set({ stock: newStock }).where(eq(productVariants.id, item.variantId));
        await db.insert(stockMovements).values({
          variantId: item.variantId,
          type: 'ingreso',
          quantity: item.quantity,
          reason: data.supplierName ? `Compra a ${data.supplierName}` : 'Ingreso de mercadería',
          referenceId: purchaseRow.id,
          date: data.date,
        });
      }
    }
  }

  const purchase: Purchase = {
    id: purchaseRow.id,
    supplierName: purchaseRow.supplierName || undefined,
    date: purchaseRow.date,
    totalCost,
    notes: purchaseRow.notes || undefined,
    items: itemRows.map(r => mapPurchaseItem(r[0])),
    createdAt: purchaseRow.createdAt.toISOString(),
  };

  return { purchase };
}

export async function deleteDbPurchase(id: string) {
  await db.delete(purchases).where(eq(purchases.id, id));
}
