export interface Category {
  readonly id: string;
  readonly nameAr: string;
  readonly nameEn: string;
  readonly displayOrder: number;
}

export interface MenuItem {
  readonly id: string;
  readonly categoryId: string;
  readonly nameAr: string;
  readonly nameEn: string;
  readonly descriptionAr: string;
  readonly descriptionEn: string;
  readonly price: number;
  readonly imageReference: string;
  readonly preparationMinutes: number;
  readonly isAvailable: boolean;
}

export interface DeliveryArea {
  readonly id: string;
  readonly nameAr: string;
  readonly nameEn: string;
  readonly deliveryFee: number;
  readonly estimatedDeliveryMinutes: number;
}

export type OrderType = 'Takeaway' | 'Delivery';
export type OrderStatus =
  'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'OnTheWay' | 'Delivered';

export interface CreateOrderRequest {
  readonly customerName: string;
  readonly customerPhone: string;
  readonly orderType: OrderType;
  readonly deliveryAreaId: string | null;
  readonly address: string | null;
  readonly customerNote: string | null;
  readonly items: readonly { readonly menuItemId: string; readonly quantity: number }[];
}

export interface CreatedOrder {
  readonly publicCode: string;
  readonly createdAt: string;
  readonly orderType: OrderType;
  readonly status: OrderStatus;
  readonly deliveryAreaNameAr: string | null;
  readonly deliveryAreaNameEn: string | null;
  readonly address: string | null;
  readonly subtotal: number;
  readonly deliveryFee: number;
  readonly total: number;
  readonly paymentMethod: 'Cash';
  readonly paymentStatus: 'Pending' | 'Paid';
  readonly trackingToken?: string;
}

export interface KitchenOrderItem {
  readonly productNameAr: string;
  readonly productNameEn: string;
  readonly quantity: number;
}

export interface KitchenOrder {
  readonly publicCode: string;
  readonly createdAt: string;
  readonly orderType: OrderType;
  readonly status: OrderStatus;
  readonly customerName: string;
  readonly deliveryAreaNameAr: string | null;
  readonly deliveryAreaNameEn: string | null;
  readonly address: string | null;
  readonly customerNote: string | null;
  readonly items: readonly KitchenOrderItem[];
}

export interface OrderStatusChangedEvent {
  readonly publicCode: string;
  readonly status: OrderStatus;
  readonly updatedAt?: string;
  readonly rowVersion?: string;
}

export interface MenuItemAvailabilityChangedEvent {
  readonly menuItemId: string;
  readonly isAvailable: boolean;
}

export interface ProblemDetails {
  readonly title?: string;
  readonly detail?: string;
  readonly code?: string;
}
