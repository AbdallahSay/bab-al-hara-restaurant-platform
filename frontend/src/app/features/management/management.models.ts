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
