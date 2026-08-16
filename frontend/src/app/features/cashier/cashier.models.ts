export interface DriverSummaryDto {
  id: string;
  name: string;
  phone?: string | null;
  isAvailable?: boolean;
}

export interface CashierOrderDto {
  id: string;
  publicCode: string;
  createdAt: string;
  orderType: 'Takeaway' | 'Delivery';
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'OnTheWay' | 'Delivered';
  customerName: string;
  deliveryAreaNameAr: string | null;
  deliveryAreaNameEn: string | null;
  address: string | null;
  customerNote: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: 'Cash';
  paymentStatus: 'Pending' | 'Paid';
  rowVersion: string;
  items: CashierOrderItemDto[];
  driverId?: string | null;
  driverName?: string | null;
  driverAssignedAtUtc?: string | null;
}

export interface CashierOrderItemDto {
  productNameAr: string;
  productNameEn: string;
  quantity: number;
}

export interface OrderDriverAssignedEvent {
  orderId: string;
  driverId: string;
  driverName: string;
  driverAssignedAtUtc?: string | null;
  publicCode?: string;
  rowVersion?: string;
}

export interface CashierOrderStatusChangedEvent {
  orderId?: string;
  publicCode?: string;
  previousStatus?: string;
  newStatus?: string;
  status?: string;
  rowVersion?: string;
}
