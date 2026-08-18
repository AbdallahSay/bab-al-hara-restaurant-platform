import { OrderStatus, OrderType } from '../customer-ordering/order.models';

export type { OrderStatus, OrderType };

export interface TrackingOrderItem {
  readonly productNameAr: string;
  readonly productNameEn: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly lineTotal: number;
}

export interface TrackingTimelineEntry {
  readonly status: OrderStatus;
  readonly changedAt: string;
}

export interface CustomerOrderTracking {
  readonly publicCode: string;
  readonly status: OrderStatus;
  readonly orderType: OrderType;
  readonly createdAt: string;
  readonly lastUpdatedAt: string;
  readonly items: readonly TrackingOrderItem[];
  readonly subtotal: number;
  readonly deliveryFee: number;
  readonly total: number;
  readonly paymentMethod: 'Cash';
  readonly paymentStatus: 'Pending' | 'Paid';
  readonly deliveryAreaNameAr: string | null;
  readonly deliveryAreaNameEn: string | null;
  readonly address: string | null;
  readonly statusTimeline: readonly TrackingTimelineEntry[];
}

export interface ReorderEligibleItem {
  readonly menuItemId: string;
  readonly nameAr: string;
  readonly nameEn: string;
  readonly imageReference: string;
  readonly quantity: number;
  readonly currentPrice: number;
}

export interface ReorderUnavailableItem {
  readonly menuItemId: string | null;
  readonly historicalNameAr: string;
  readonly historicalNameEn: string;
  readonly reason: 'SoldOut' | 'Inactive' | 'NotFound' | string;
}

export interface ReorderPreview {
  readonly publicCode: string;
  readonly orderType: OrderType;
  readonly eligibleItems: readonly ReorderEligibleItem[];
  readonly unavailableItems: readonly ReorderUnavailableItem[];
  readonly suggestedDeliveryAreaId: string | null;
  readonly suggestedDeliveryAreaNameAr: string | null;
  readonly suggestedDeliveryAreaNameEn: string | null;
  readonly suggestedAddress: string | null;
  readonly suggestedCustomerNote: string | null;
}
