
export interface MenuItem {
  id: string;
  name: string;
  price: number;
}

export interface Customer {
  name: string;
  contact: string;
  whatsapp: string;
}

export interface OrderItem {
  menuId: string;
  quantity: number;
  name: string;
  price: number;
  isPacked?: boolean; // New: Supports hybrid orders (Eat-in + Take-away)
}

export interface Order {
  id: string;
  tableNo: string;
  persons: number;
  customer: Customer;
  items: OrderItem[];
  total: number;
  paidAmount?: number;
  balance?: number;
  timestamp: number;
  status: 'active' | 'completed';
  orderType: 'Dine In' | 'Take Away';
}

export type ViewState = 'pos' | 'menu' | 'reports' | 'history';

export interface DraftOrder {
  editingOrderId?: string;
  customer: Customer;
  tableNo: string;
  persons: string;
  items: OrderItem[];
  paidAmount: string;
  orderType: 'Dine In' | 'Take Away' | null; // Changed to null to force selection
}
