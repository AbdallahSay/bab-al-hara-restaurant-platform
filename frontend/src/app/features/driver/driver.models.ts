export type DriverOrderStatus = 'Ready' | 'OnTheWay' | 'Delivered' | string;

export interface DriverOrderItemDto {
  readonly productNameAr: string;
  readonly productNameEn: string;
  readonly quantity: number;
}

export type DriverOrderItem = DriverOrderItemDto;

export interface DriverOrderDto {
  readonly id: string;
  readonly publicCode: string;
  readonly createdAt: string;
  readonly orderType: 'Delivery' | 'Takeaway' | string;
  readonly status: DriverOrderStatus;
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
  readonly rowVersion: string;
  readonly items: readonly DriverOrderItemDto[];
}
