export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';
export type PaymentStatus = 'pagado' | 'pendiente' | 'parcial';
export type StockMovementType = 'ingreso' | 'venta' | 'ajuste' | 'devolucion';
export type ProductStatus = 'active' | 'archived';
export type ExpenseCategory =
  | 'mercaderia'
  | 'alquiler'
  | 'servicios'
  | 'sueldos'
  | 'marketing'
  | 'envios'
  | 'packaging'
  | 'otros';

export interface Client {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  preferredSize?: string;
  preferences?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  brand?: string;
  description?: string;
  salePrice: number;
  cost?: number;
  sku?: string;
  barcode?: string;
  status: ProductStatus;
  images?: string[];
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  size?: string;
  color?: string;
  sku?: string;
  stock: number;
  minStock: number;
  location?: string;
  createdAt: string;
}

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

export interface StockMovement {
  id: string;
  variantId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  notes?: string;
  referenceId?: string;
  date: string;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  variantId?: string;
  productName: string;
  variantInfo?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt: string;
}

export interface Sale {
  id: string;
  clientId: string;
  date: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  observations?: string;
  items: SaleItem[];
  createdAt: string;
}

export interface Payment {
  id: string;
  saleId: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  observations?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  variantId?: string;
  productName: string;
  variantInfo?: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
  createdAt: string;
}

export interface Purchase {
  id: string;
  supplierName?: string;
  date: string;
  totalCost: number;
  notes?: string;
  items: PurchaseItem[];
  createdAt: string;
}

export interface CartItem {
  variantId?: string;
  productName: string;
  variantInfo?: string;
  quantity: number;
  unitPrice: number;
}
