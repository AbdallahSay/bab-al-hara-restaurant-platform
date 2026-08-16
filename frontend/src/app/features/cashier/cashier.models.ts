export interface CashierOrderDto {
  id: string;
  publicCode: string;
  createdAt: string;
  orderType: 'Takeaway' | 'Delivery';
  status: 'Ready';
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
}

export interface CashierOrderItemDto {
  productNameAr: string;
  productNameEn: string;
  quantity: number;
}
