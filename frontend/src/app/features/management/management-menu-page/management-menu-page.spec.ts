import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
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
    uploadMenuItemImage: ReturnType<typeof vi.fn>;
    deleteMenuItemImage: ReturnType<typeof vi.fn>;
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
      uploadMenuItemImage: vi.fn(),
      deleteMenuItemImage: vi.fn(),
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

  it('should open create modal with empty image state and 4 structured sections', () => {
    component.openCreateItemModal();
    expect(component['itemModalOpen']()).toBe(true);
    expect(component['editingItem']()).toBeNull();
    expect(component['imagePreviewUrl']()).toBeNull();
    expect(component['selectedImageFile']()).toBeNull();
    expect(component['imageRemoved']()).toBe(false);
  });

  it('should open edit modal and load existing image into preview', () => {
    const item = MOCK_ITEMS[0]!;
    component.openEditItemModal(item);
    expect(component['itemModalOpen']()).toBe(true);
    expect(component['editingItem']()).toEqual(item);
    expect(component['imagePreviewUrl']()).toBe('/img/kebab.webp');
  });

  it('should validate and reject oversized image (> 5MB)', () => {
    component.openCreateItemModal();

    // Create 6MB fake file
    const giantFile = new File([new Uint8Array(6 * 1024 * 1024)], 'huge.jpg', {
      type: 'image/jpeg',
    });

    const event = {
      target: {
        files: [giantFile],
        value: 'C:\\fakepath\\huge.jpg',
      },
    } as unknown as Event;

    component.onFileSelected(event);

    expect(component['imageError']()).toBeTruthy();
    expect(component['selectedImageFile']()).toBeNull();
  });

  it('should validate and reject unsupported image format', () => {
    component.openCreateItemModal();

    const pdfFile = new File(['%PDF-1.4'], 'menu.pdf', {
      type: 'application/pdf',
    });

    const event = {
      target: {
        files: [pdfFile],
        value: 'C:\\fakepath\\menu.pdf',
      },
    } as unknown as Event;

    component.onFileSelected(event);

    expect(component['imageError']()).toBeTruthy();
    expect(component['selectedImageFile']()).toBeNull();
  });

  it('should stage valid image file and set preview', () => {
    component.openCreateItemModal();

    const validFile = new File(['valid-bytes'], 'mixed-grill.png', {
      type: 'image/png',
    });

    const event = {
      target: {
        files: [validFile],
        value: 'C:\\fakepath\\mixed-grill.png',
      },
    } as unknown as Event;

    component.onFileSelected(event);

    expect(component['imageError']()).toBeNull();
    expect(component['selectedImageFile']()).toBe(validFile);
  });

  it('should handle removing image with confirmation modal for persisted image', () => {
    const item = MOCK_ITEMS[0]!;
    component.openEditItemModal(item);
    expect(component['imagePreviewUrl']()).toBe('/img/kebab.webp');

    // Request remove -> opens confirmation
    component.requestRemoveImage();
    expect(component['removeConfirmModalOpen']()).toBe(true);

    // Confirm remove -> clears preview and sets imageRemoved
    component.confirmRemoveImage();
    expect(component['removeConfirmModalOpen']()).toBe(false);
    expect(component['imagePreviewUrl']()).toBeNull();
    expect(component['imageRemoved']()).toBe(true);
  });

  it('should create menu item and upload staged image seamlessly', () => {
    component.openCreateItemModal();
    component['itemForm'].patchValue({
      categoryId: 'cat-1',
      nameAr: 'شيش طاووق',
      nameEn: 'Shish Tawook',
      price: 120,
      preparationMinutes: 15,
      displayOrder: 2,
    });

    const validFile = new File(['valid-bytes'], 'shish.webp', { type: 'image/webp' });
    component['selectedImageFile'].set(validFile);

    const createdItem: MenuItemManagementDto = {
      id: 'item-2',
      categoryId: 'cat-1',
      categoryNameAr: 'مشاوي',
      categoryNameEn: 'Grills',
      nameAr: 'شيش طاووق',
      nameEn: 'Shish Tawook',
      descriptionAr: '',
      descriptionEn: '',
      price: 120,
      imageReference: '/images/menu/default.webp',
      preparationMinutes: 15,
      displayOrder: 2,
      isActive: true,
      isAvailable: true,
      rowVersion: 'v2',
    };

    const uploadedItem: MenuItemManagementDto = {
      ...createdItem,
      imageReference: '/api/menu-images/22222222-2222-2222-2222-222222222222',
    };

    apiMock.createMenuItem.mockReturnValue(of(createdItem));
    apiMock.uploadMenuItemImage.mockReturnValue(of(uploadedItem));

    component.saveMenuItem();

    expect(apiMock.createMenuItem).toHaveBeenCalled();
    expect(apiMock.uploadMenuItemImage).toHaveBeenCalledWith('item-2', validFile);
    expect(component['itemModalOpen']()).toBe(false);
  });

  it('should retain form and allow retry if image upload fails after item creation', () => {
    component.openCreateItemModal();
    component['itemForm'].patchValue({
      categoryId: 'cat-1',
      nameAr: 'شيش طاووق',
      nameEn: 'Shish Tawook',
      price: 120,
    });

    const validFile = new File(['valid-bytes'], 'shish.webp', { type: 'image/webp' });
    component['selectedImageFile'].set(validFile);

    const createdItem: MenuItemManagementDto = {
      id: 'item-2',
      categoryId: 'cat-1',
      categoryNameAr: 'مشاوي',
      categoryNameEn: 'Grills',
      nameAr: 'شيش طاووق',
      nameEn: 'Shish Tawook',
      descriptionAr: '',
      descriptionEn: '',
      price: 120,
      imageReference: '/images/menu/default.webp',
      preparationMinutes: 15,
      displayOrder: 2,
      isActive: true,
      isAvailable: true,
      rowVersion: 'v2',
    };

    apiMock.createMenuItem.mockReturnValue(of(createdItem));
    apiMock.uploadMenuItemImage.mockReturnValue(throwError(() => new Error('Upload failed')));

    component.saveMenuItem();

    expect(apiMock.createMenuItem).toHaveBeenCalled();
    expect(component['itemModalOpen']()).toBe(true);
    expect(component['persistedItemIdAfterCreate']()).toBe('item-2');
    expect(component['itemError']()).toBeTruthy();

    // Retry upload
    const uploadedItem: MenuItemManagementDto = {
      ...createdItem,
      imageReference: '/api/menu-images/22222222-2222-2222-2222-222222222222',
    };
    apiMock.uploadMenuItemImage.mockReturnValue(of(uploadedItem));

    component.retryImageUpload();

    expect(apiMock.uploadMenuItemImage).toHaveBeenCalledWith('item-2', validFile);
    expect(component['itemModalOpen']()).toBe(false);
  });

  it('should save existing item and delete image if removed', () => {
    const item = MOCK_ITEMS[0]!;
    component.openEditItemModal(item);
    component.requestRemoveImage();
    component.confirmRemoveImage();

    apiMock.updateMenuItem.mockReturnValue(of(item));
    apiMock.deleteMenuItemImage.mockReturnValue(
      of({ ...item, imageReference: '/images/menu/default.webp' }),
    );

    component.saveMenuItem();

    expect(apiMock.updateMenuItem).toHaveBeenCalled();
    expect(apiMock.deleteMenuItemImage).toHaveBeenCalledWith('item-1');
    expect(component['itemModalOpen']()).toBe(false);
  });
});
