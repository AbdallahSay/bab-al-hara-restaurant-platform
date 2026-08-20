export interface RestaurantControlDto {
  readonly acceptingOrders: boolean;
  readonly pauseMessageAr: string | null;
  readonly pauseMessageEn: string | null;
  readonly updatedAtUtc: string;
  readonly updatedByStaffDisplayName: string | null;
  readonly rowVersion: string;
}

export interface UpdateRestaurantControlRequest {
  readonly acceptingOrders: boolean;
  readonly pauseMessageAr: string | null;
  readonly pauseMessageEn: string | null;
  readonly rowVersion?: string | null;
}

export interface CategoryManagementDto {
  readonly id: string;
  readonly nameAr: string;
  readonly nameEn: string;
  readonly displayOrder: number;
  readonly isActive: boolean;
  readonly itemCount: number;
  readonly rowVersion: string;
}

export interface CreateCategoryRequest {
  readonly nameAr: string;
  readonly nameEn: string;
  readonly displayOrder: number;
  readonly isActive: boolean;
}

export interface UpdateCategoryRequest {
  readonly nameAr: string;
  readonly nameEn: string;
  readonly displayOrder: number;
  readonly isActive: boolean;
  readonly rowVersion?: string | null;
}

export interface ToggleActiveRequest {
  readonly isActive: boolean;
  readonly rowVersion?: string | null;
}

export interface MenuItemManagementDto {
  readonly id: string;
  readonly categoryId: string;
  readonly categoryNameAr: string;
  readonly categoryNameEn: string;
  readonly nameAr: string;
  readonly nameEn: string;
  readonly descriptionAr: string;
  readonly descriptionEn: string;
  readonly price: number;
  readonly imageReference: string;
  readonly preparationMinutes: number;
  readonly displayOrder: number;
  readonly isActive: boolean;
  readonly isAvailable: boolean;
  readonly rowVersion: string;
}

export interface CreateMenuItemRequest {
  readonly categoryId: string;
  readonly nameAr: string;
  readonly nameEn: string;
  readonly descriptionAr: string;
  readonly descriptionEn: string;
  readonly price: number;
  readonly imageReference: string;
  readonly preparationMinutes: number;
  readonly displayOrder: number;
  readonly isActive: boolean;
  readonly isAvailable: boolean;
}

export interface UpdateMenuItemRequest {
  readonly categoryId: string;
  readonly nameAr: string;
  readonly nameEn: string;
  readonly descriptionAr: string;
  readonly descriptionEn: string;
  readonly price: number;
  readonly imageReference: string;
  readonly preparationMinutes: number;
  readonly displayOrder: number;
  readonly isActive: boolean;
  readonly isAvailable: boolean;
  readonly rowVersion?: string | null;
}

export interface ToggleMenuItemAvailabilityRequest {
  readonly isAvailable: boolean;
  readonly rowVersion?: string | null;
}

export interface OperationsSummaryDto {
  readonly activeOrders: number;
  readonly pending: number;
  readonly confirmed: number;
  readonly preparing: number;
  readonly ready: number;
  readonly onTheWay: number;
  readonly deliveryWaitingForDriver: number;
}

export interface OperationsAttentionItemDto {
  readonly orderId: string;
  readonly publicCode: string;
  readonly createdAtUtc: string;
  readonly currentStatusSinceUtc: string;
  readonly orderType: 'Takeaway' | 'Delivery';
  readonly status: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'OnTheWay' | 'Delivered';
  readonly reasonCode: string;
  readonly customerName: string;
  readonly total: number;
}

export interface OperationsOrderItemDto {
  readonly productNameAr: string;
  readonly productNameEn: string;
  readonly quantity: number;
}

export interface OperationsStatusHistoryDto {
  readonly previousStatus:
    'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'OnTheWay' | 'Delivered';
  readonly newStatus: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'OnTheWay' | 'Delivered';
  readonly actorRole: string | null;
  readonly changedAtUtc: string;
  readonly notes: string | null;
}

export interface OperationsActiveOrderDto {
  readonly orderId: string;
  readonly publicCode: string;
  readonly createdAtUtc: string;
  readonly currentStatusSinceUtc: string;
  readonly orderType: 'Takeaway' | 'Delivery';
  readonly status: 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'OnTheWay' | 'Delivered';
  readonly customerName: string;
  readonly customerPhone: string;
  readonly deliveryAreaNameAr: string | null;
  readonly deliveryAreaNameEn: string | null;
  readonly address: string | null;
  readonly customerNote: string | null;
  readonly subtotal: number;
  readonly deliveryFee: number;
  readonly total: number;
  readonly paymentMethod: 'Cash';
  readonly paymentStatus: 'Pending' | 'Paid';
  readonly driverId: string | null;
  readonly driverName: string | null;
  readonly driverAssignedAtUtc: string | null;
  readonly items: readonly OperationsOrderItemDto[];
  readonly statusHistory: readonly OperationsStatusHistoryDto[];
}

export interface OperationsCommandCenterResponse {
  readonly summary: OperationsSummaryDto;
  readonly attentionItems: readonly OperationsAttentionItemDto[];
  readonly activeOrders: readonly OperationsActiveOrderDto[];
}

export type FulfillmentFilterType = 'All' | 'Delivery' | 'Takeaway';
export type DatePreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom';

export interface ReportSummaryDto {
  readonly completedSalesRevenue: number;
  readonly completedOrdersCount: number;
  readonly averageOrderValue: number;
  readonly totalOrdersPlaced: number;
}

export interface DailySalesTrendDto {
  readonly date: string;
  readonly revenue: number;
  readonly completedOrdersCount: number;
  readonly totalOrdersCount: number;
}

export interface FulfillmentMetricDto {
  readonly orderType: 'Delivery' | 'Takeaway';
  readonly count: number;
  readonly revenue: number;
  readonly deliveryFees: number;
  readonly percentageOfTotal: number;
}

export interface FulfillmentBreakdownDto {
  readonly delivery: FulfillmentMetricDto;
  readonly takeaway: FulfillmentMetricDto;
}

export interface BestSellingItemDto {
  readonly rank: number;
  readonly itemId: string;
  readonly itemNameAr: string;
  readonly itemNameEn: string;
  readonly quantitySold: number;
  readonly totalRevenue: number;
}

export interface OperationalTimingDto {
  readonly averagePreparationMinutes: number | null;
  readonly averageDeliveryMinutes: number | null;
  readonly averageTotalFulfillmentMinutes: number | null;
}

export interface HourlyDistributionDto {
  readonly hour: number;
  readonly hourLabel: string;
  readonly orderCount: number;
  readonly revenue: number;
}

export interface ManagementReportResponse {
  readonly fromDate: string;
  readonly toDate: string;
  readonly fulfillmentFilter: FulfillmentFilterType;
  readonly generatedAtUtc: string;
  readonly summary: ReportSummaryDto;
  readonly dailyTrends: readonly DailySalesTrendDto[];
  readonly fulfillmentBreakdown: FulfillmentBreakdownDto;
  readonly bestSellingItems: readonly BestSellingItemDto[];
  readonly operationalTiming: OperationalTimingDto;
  readonly hourlyDistribution: readonly HourlyDistributionDto[];
}

export interface ReportQueryParams {
  readonly from: string;
  readonly to: string;
  readonly fulfillment?: FulfillmentFilterType;
}
