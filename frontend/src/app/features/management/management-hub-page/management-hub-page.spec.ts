import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StaffSessionService } from '../../kitchen/staff-session.service';
import { ManagementApiService } from '../management-api.service';
import { CategoryManagementDto, MenuItemManagementDto } from '../management.models';
import { ManagementHubPage } from './management-hub-page';

describe('ManagementHubPage', () => {
  let component: ManagementHubPage;
  let fixture: ComponentFixture<ManagementHubPage>;
  let apiMock: {
    getCategories: ReturnType<typeof vi.fn>;
    getMenuItems: ReturnType<typeof vi.fn>;
    getRestaurantControlStatus: ReturnType<typeof vi.fn>;
  };
  let sessionMock: { signOut: ReturnType<typeof vi.fn> };

  const MOCK_CATEGORIES: CategoryManagementDto[] = [
    {
      id: 'cat-1',
      nameAr: 'مشاوي',
      nameEn: 'Grills',
      displayOrder: 1,
      isActive: true,
      itemCount: 5,
      rowVersion: 'v1',
    },
    {
      id: 'cat-2',
      nameAr: 'مشروبات',
      nameEn: 'Drinks',
      displayOrder: 2,
      isActive: false,
      itemCount: 2,
      rowVersion: 'v2',
    },
  ];

  const MOCK_ITEMS: MenuItemManagementDto[] = [
    {
      id: 'item-1',
      categoryId: 'cat-1',
      categoryNameAr: 'مشاوي',
      categoryNameEn: 'Grills',
      nameAr: 'كباب',
      nameEn: 'Kebab',
      descriptionAr: '',
      descriptionEn: '',
      price: 150,
      imageReference: '/img/kebab.webp',
      preparationMinutes: 20,
      displayOrder: 1,
      isActive: true,
      isAvailable: true,
      rowVersion: 'v1',
    },
    {
      id: 'item-2',
      categoryId: 'cat-1',
      categoryNameAr: 'مشاوي',
      categoryNameEn: 'Grills',
      nameAr: 'شيش',
      nameEn: 'Shish',
      descriptionAr: '',
      descriptionEn: '',
      price: 120,
      imageReference: '/img/shish.webp',
      preparationMinutes: 15,
      displayOrder: 2,
      isActive: true,
      isAvailable: false,
      rowVersion: 'v2',
    },
    {
      id: 'item-3',
      categoryId: 'cat-2',
      categoryNameAr: 'مشروبات',
      categoryNameEn: 'Drinks',
      nameAr: 'عصير',
      nameEn: 'Juice',
      descriptionAr: '',
      descriptionEn: '',
      price: 30,
      imageReference: '/img/juice.webp',
      preparationMinutes: 5,
      displayOrder: 1,
      isActive: false,
      isAvailable: true,
      rowVersion: 'v3',
    },
  ];

  beforeEach(async () => {
    apiMock = {
      getCategories: vi.fn().mockReturnValue(of(MOCK_CATEGORIES)),
      getMenuItems: vi.fn().mockReturnValue(of(MOCK_ITEMS)),
      getRestaurantControlStatus: vi.fn().mockReturnValue(
        of({
          acceptingOrders: true,
          pauseMessageAr: null,
          pauseMessageEn: null,
          updatedAtUtc: '2026-08-17T00:00:00Z',
          updatedByStaffDisplayName: 'Manager',
          rowVersion: 'token',
        }),
      ),
    };
    sessionMock = {
      signOut: vi.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [ManagementHubPage],
      providers: [
        provideRouter([]),
        { provide: ManagementApiService, useValue: apiMock },
        { provide: StaffSessionService, useValue: sessionMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagementHubPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should calculate catalog stats correctly', () => {
    expect(component['activeCategoriesCount']()).toBe(1);
    expect(component['availableItemsCount']()).toBe(1);
    expect(component['soldOutItemsCount']()).toBe(1);
    expect(component['archivedItemsCount']()).toBe(1);
  });
});
