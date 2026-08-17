import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { CustomerApiService } from '../customer-ordering/customer-api.service';
import { ManagementApiService } from './management-api.service';
import {
  CategoryManagementDto,
  MenuItemManagementDto,
  RestaurantControlDto,
} from './management.models';

describe('ManagementApiService', () => {
  let service: ManagementApiService;
  let httpMock: HttpTestingController;
  const baseUrl = 'https://api.test';

  const mockCustomerApi = {
    antiforgeryToken: () => of('mock-token-xyz'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ManagementApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_ENVIRONMENT, useValue: { apiBaseUrl: baseUrl } },
        { provide: CustomerApiService, useValue: mockCustomerApi },
      ],
    });

    service = TestBed.inject(ManagementApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch restaurant control status', () => {
    const mockStatus: RestaurantControlDto = {
      acceptingOrders: true,
      pauseMessageAr: null,
      pauseMessageEn: null,
      updatedAtUtc: '2026-08-17T12:00:00Z',
      updatedByStaffDisplayName: 'Manager 1',
      rowVersion: 'AAAAAA==',
    };

    service.getRestaurantControlStatus().subscribe((res) => {
      expect(res).toEqual(mockStatus);
    });

    const req = httpMock.expectOne(`${baseUrl}/management/restaurant/status`);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    req.flush(mockStatus);
  });

  it('should update restaurant control status with CSRF token', () => {
    const mockStatus: RestaurantControlDto = {
      acceptingOrders: false,
      pauseMessageAr: 'مغلق',
      pauseMessageEn: 'Closed',
      updatedAtUtc: '2026-08-17T12:30:00Z',
      updatedByStaffDisplayName: 'Manager 1',
      rowVersion: 'BBBBBB==',
    };

    service
      .updateRestaurantControlStatus({
        acceptingOrders: false,
        pauseMessageAr: 'مغلق',
        pauseMessageEn: 'Closed',
        rowVersion: 'AAAAAA==',
      })
      .subscribe((res) => {
        expect(res).toEqual(mockStatus);
      });

    const req = httpMock.expectOne(`${baseUrl}/management/restaurant/status`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('X-XSRF-TOKEN')).toBe('mock-token-xyz');
    expect(req.request.withCredentials).toBe(true);
    req.flush(mockStatus);
  });

  it('should get categories', () => {
    const mockCategories: CategoryManagementDto[] = [
      {
        id: 'cat-1',
        nameAr: 'مشاوي',
        nameEn: 'Grills',
        displayOrder: 1,
        isActive: true,
        itemCount: 4,
        rowVersion: 'CAT1==',
      },
    ];

    service.getCategories().subscribe((res) => {
      expect(res).toEqual(mockCategories);
    });

    const req = httpMock.expectOne(`${baseUrl}/management/categories`);
    expect(req.request.method).toBe('GET');
    req.flush(mockCategories);
  });

  it('should create category', () => {
    const newCat: CategoryManagementDto = {
      id: 'cat-2',
      nameAr: 'مشروبات',
      nameEn: 'Drinks',
      displayOrder: 2,
      isActive: true,
      itemCount: 0,
      rowVersion: 'CAT2==',
    };

    service
      .createCategory({
        nameAr: 'مشروبات',
        nameEn: 'Drinks',
        displayOrder: 2,
        isActive: true,
      })
      .subscribe((res) => {
        expect(res).toEqual(newCat);
      });

    const req = httpMock.expectOne(`${baseUrl}/management/categories`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('X-XSRF-TOKEN')).toBe('mock-token-xyz');
    req.flush(newCat);
  });

  it('should update category', () => {
    const updatedCat: CategoryManagementDto = {
      id: 'cat-1',
      nameAr: 'مشاوي فاخرة',
      nameEn: 'Premium Grills',
      displayOrder: 1,
      isActive: true,
      itemCount: 4,
      rowVersion: 'CAT1B==',
    };

    service
      .updateCategory('cat-1', {
        nameAr: 'مشاوي فاخرة',
        nameEn: 'Premium Grills',
        displayOrder: 1,
        isActive: true,
        rowVersion: 'CAT1==',
      })
      .subscribe((res) => {
        expect(res).toEqual(updatedCat);
      });

    const req = httpMock.expectOne(`${baseUrl}/management/categories/cat-1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('X-XSRF-TOKEN')).toBe('mock-token-xyz');
    req.flush(updatedCat);
  });

  it('should toggle category active status', () => {
    const toggled: CategoryManagementDto = {
      id: 'cat-1',
      nameAr: 'مشاوي',
      nameEn: 'Grills',
      displayOrder: 1,
      isActive: false,
      itemCount: 4,
      rowVersion: 'CAT1C==',
    };

    service
      .toggleCategoryStatus('cat-1', { isActive: false, rowVersion: 'CAT1B==' })
      .subscribe((res) => {
        expect(res.isActive).toBe(false);
      });

    const req = httpMock.expectOne(`${baseUrl}/management/categories/cat-1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.headers.get('X-XSRF-TOKEN')).toBe('mock-token-xyz');
    req.flush(toggled);
  });

  it('should get menu items with optional categoryId filter', () => {
    const mockItems: MenuItemManagementDto[] = [
      {
        id: 'item-1',
        categoryId: 'cat-1',
        categoryNameAr: 'مشاوي',
        categoryNameEn: 'Grills',
        nameAr: 'مشاوي مشكلة',
        nameEn: 'Mixed Grill',
        descriptionAr: 'طبق مشكل',
        descriptionEn: 'Mixed platter',
        price: 250,
        imageReference: '/images/menu/mixed-grill.webp',
        preparationMinutes: 25,
        displayOrder: 1,
        isActive: true,
        isAvailable: true,
        rowVersion: 'ITEM1==',
      },
    ];

    service.getMenuItems('cat-1').subscribe((res) => {
      expect(res).toEqual(mockItems);
    });

    const req = httpMock.expectOne(`${baseUrl}/management/menu-items?categoryId=cat-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockItems);
  });

  it('should toggle menu item availability', () => {
    const updatedItem: MenuItemManagementDto = {
      id: 'item-1',
      categoryId: 'cat-1',
      categoryNameAr: 'مشاوي',
      categoryNameEn: 'Grills',
      nameAr: 'مشاوي مشكلة',
      nameEn: 'Mixed Grill',
      descriptionAr: 'طبق مشكل',
      descriptionEn: 'Mixed platter',
      price: 250,
      imageReference: '/images/menu/mixed-grill.webp',
      preparationMinutes: 25,
      displayOrder: 1,
      isActive: true,
      isAvailable: false,
      rowVersion: 'ITEM1B==',
    };

    service
      .toggleMenuItemAvailability('item-1', { isAvailable: false, rowVersion: 'ITEM1==' })
      .subscribe((res) => {
        expect(res.isAvailable).toBe(false);
      });

    const req = httpMock.expectOne(`${baseUrl}/management/menu-items/item-1/availability`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.headers.get('X-XSRF-TOKEN')).toBe('mock-token-xyz');
    req.flush(updatedItem);
  });

  it('should toggle menu item active status', () => {
    const updatedItem: MenuItemManagementDto = {
      id: 'item-1',
      categoryId: 'cat-1',
      categoryNameAr: 'مشاوي',
      categoryNameEn: 'Grills',
      nameAr: 'مشاوي مشكلة',
      nameEn: 'Mixed Grill',
      descriptionAr: 'طبق مشكل',
      descriptionEn: 'Mixed platter',
      price: 250,
      imageReference: '/images/menu/mixed-grill.webp',
      preparationMinutes: 25,
      displayOrder: 1,
      isActive: false,
      isAvailable: true,
      rowVersion: 'ITEM1C==',
    };

    service
      .toggleMenuItemStatus('item-1', { isActive: false, rowVersion: 'ITEM1B==' })
      .subscribe((res) => {
        expect(res.isActive).toBe(false);
      });

    const req = httpMock.expectOne(`${baseUrl}/management/menu-items/item-1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.headers.get('X-XSRF-TOKEN')).toBe('mock-token-xyz');
    req.flush(updatedItem);
  });
});
