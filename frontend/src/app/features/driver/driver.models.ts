import { OrderStatus, OrderType } from '../customer-ordering/order.models';

export interface DriverOrderItem {
  readonly productNameAr: string;
  readonly productNameEn: string;
  readonly quantity: number;
}

export interface DriverOrderDto {
  readonly id?: string;
  readonly publicCode: string;
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly orderType: OrderType;
  readonly status: OrderStatus;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly deliveryAreaNameAr: string | null;
  readonly deliveryAreaNameEn: string | null;
  readonly address: string | null;
  readonly customerNote: string | null;
  readonly subtotal: number;
  readonly deliveryFee: number;
  readonly total: number;
  readonly paymentMethod: 'Cash' | string;
  readonly paymentStatus: 'Pending' | 'Paid' | string;
  readonly rowVersion?: string;
  readonly items?: readonly DriverOrderItem[];
}

export interface TransitionResult {
  readonly isSuccess?: boolean;
  readonly success?: boolean;
  readonly order?: DriverOrderDto;
  readonly errorCode?: string;
  readonly errorMessage?: string;
  readonly isConcurrencyConflict?: boolean;
}

export interface DriverOrderStatusChangedEvent {
  readonly publicCode: string;
  readonly previousStatus?: OrderStatus;
  readonly newStatus?: OrderStatus;
  readonly status?: OrderStatus;
  readonly rowVersion?: string;
  readonly changedAtUtc?: string;
}
