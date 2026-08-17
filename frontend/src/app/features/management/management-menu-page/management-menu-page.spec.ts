import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StaffSessionService } from '../../kitchen/staff-session.service';
import { ManagementApiService } from '../management-api.service';
import { CategoryManagementDto, MenuItemManagementDto } from '../management.models';
import { ManagementMenuPage } from './management-menu-page';

describe('ManagementMenuPage', () => {
  let component: ManagementMenuPage;
  let fixture: ComponentFixture<ManagementMenuPage>;
  let apiMock: {
    getCategories: ReturnType<typeof vi.fn>;
    getMenuItems: ReturnType<typeof vi.fn>;
    createCategory: ReturnType<typeof vi.fn>;
    updateCategory: ReturnType<typeof vi.fn>;
    toggleCategoryStatus: ReturnType<typeof vi.fn>;
    createMenuItem: ReturnType<typeof vi.fn>;
    updateMenuItem: ReturnType<typeof vi.fn>;
    toggleMenuItemAvailability: ReturnType<typeof vi.fn>;
    toggleMenuItemStatus: ReturnType<typeof vi.fn>;
  };
  let sessionMock: {
    signOut: ReturnType<typeof vi.fn>;
    signOutManagement: ReturnType<typeof vi.fn>;
  };

  const MOCK_CATEGORIES: CategoryManagementDto[] = [
    {
      id: 'cat-1',
      nameAr: 'مشاوي',
      nameEn: 'Grills',
      displayOrder: 1,
      isActive: true,
      itemCount: 1,
      rowVersion: 'v1',
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
  ];

  beforeEach(async () => {
    apiMock = {
      getCategories: vi.fn().mockReturnValue(of(MOCK_CATEGORIES)),
      getMenuItems: vi.fn().mockReturnValue(of(MOCK_ITEMS)),
      createCategory: vi.fn(),
      updateCategory: vi.fn(),
      toggleCategoryStatus: vi.fn(),
      createMenuItem: vi.fn(),
      updateMenuItem: vi.fn(),
      toggleMenuItemAvailability: vi.fn(),
      toggleMenuItemStatus: vi.fn(),
    };
    sessionMock = {
      signOut: vi.fn().mockReturnValue(of(undefined)),
      signOutManagement: vi.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [ManagementMenuPage],
      providers: [
        provideRouter([]),
        { provide: ManagementApiService, useValue: apiMock },
        { provide: StaffSessionService, useValue: sessionMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagementMenuPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load categories and items on init', () => {
    expect(apiMock.getCategories).toHaveBeenCalled();
    expect(apiMock.getMenuItems).toHaveBeenCalled();
    expect(component['menuItems']().length).toBe(1);
    expect(component['categories']().length).toBe(1);
  });

  it('should toggle item availability with 1-click', () => {
    const item = MOCK_ITEMS[0]!;
    apiMock.toggleMenuItemAvailability.mockReturnValue(
      of({
        ...item,
        isAvailable: false,
      }),
    );

    component.toggleItemAvailability(item);

    expect(apiMock.toggleMenuItemAvailability).toHaveBeenCalledWith('item-1', {
      isAvailable: false,
      rowVersion: 'v1',
    });
  });
});
