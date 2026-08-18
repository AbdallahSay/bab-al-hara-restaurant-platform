import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { formatMoney, localizedText } from '../../../core/i18n/formatters';
import { LanguageService } from '../../../core/i18n/language.service';
import { StaffSessionService } from '../../kitchen/staff-session.service';
import { ManagementApiService } from '../management-api.service';
import {
  CategoryManagementDto,
  CreateCategoryRequest,
  CreateMenuItemRequest,
  MenuItemManagementDto,
  ToggleActiveRequest,
  ToggleMenuItemAvailabilityRequest,
  UpdateCategoryRequest,
  UpdateMenuItemRequest,
} from '../management.models';

type TabType = 'menuItems' | 'categories';

@Component({
  selector: 'app-management-menu-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './management-menu-page.html',
  styleUrl: './management-menu-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagementMenuPage implements OnInit {
  private readonly api = inject(ManagementApiService);
  private readonly session = inject(StaffSessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;

  protected readonly activeTab = signal<TabType>('menuItems');
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly feedbackMessage = signal<string | null>(null);

  protected readonly categories = signal<readonly CategoryManagementDto[]>([]);
  protected readonly menuItems = signal<readonly MenuItemManagementDto[]>([]);

  // Filtering
  protected readonly selectedCategoryId = signal<string | null>(null);
  protected readonly searchQuery = signal('');

  protected readonly filteredMenuItems = computed(() => {
    let items = this.menuItems();
    const catId = this.selectedCategoryId();
    if (catId) {
      items = items.filter((i) => i.categoryId === catId);
    }
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      items = items.filter(
        (i) =>
          i.nameAr.toLowerCase().includes(query) ||
          i.nameEn.toLowerCase().includes(query) ||
          i.descriptionAr.toLowerCase().includes(query) ||
          i.descriptionEn.toLowerCase().includes(query),
      );
    }
    return items;
  });

  // Category Modal State
  protected readonly categoryModalOpen = signal(false);
  protected readonly editingCategory = signal<CategoryManagementDto | null>(null);
  protected readonly categorySaving = signal(false);
  protected readonly categoryError = signal<string | null>(null);
  protected readonly categoryForm = new FormGroup({
    nameAr: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    nameEn: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    displayOrder: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    isActive: new FormControl(true, { nonNullable: true }),
  });

  // Menu Item Modal State
  protected readonly itemModalOpen = signal(false);
  protected readonly editingItem = signal<MenuItemManagementDto | null>(null);
  protected readonly itemSaving = signal(false);
  protected readonly itemError = signal<string | null>(null);

  // Image Card State
  protected readonly selectedImageFile = signal<File | null>(null);
  protected readonly imagePreviewUrl = signal<string | null>(null);
  protected readonly imageRemoved = signal(false);
  protected readonly imageUploading = signal(false);
  protected readonly imageError = signal<string | null>(null);
  protected readonly removeConfirmModalOpen = signal(false);
  protected readonly persistedItemIdAfterCreate = signal<string | null>(null);
  protected readonly isDraggingOver = signal(false);

  readonly maxFileSizeBytes = 5 * 1024 * 1024; // 5 MB
  readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  readonly allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  protected readonly itemForm = new FormGroup({
    categoryId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    nameAr: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    nameEn: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    descriptionAr: new FormControl('', { nonNullable: true }),
    descriptionEn: new FormControl('', { nonNullable: true }),
    price: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.01)],
    }),
    preparationMinutes: new FormControl(15, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(240)],
    }),
    displayOrder: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    isActive: new FormControl(true, { nonNullable: true }),
    isAvailable: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      categories: this.api.getCategories(),
      menuItems: this.api.getMenuItems(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ categories, menuItems }) => {
          this.categories.set(categories);
          this.menuItems.set(menuItems);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(this.copy().management.errors.loadFailed);
          this.loading.set(false);
        },
      });
  }

  setTab(tab: TabType): void {
    this.activeTab.set(tab);
  }

  selectCategoryFilter(categoryId: string | null): void {
    this.selectedCategoryId.set(categoryId);
  }

  updateSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  // --- Category Actions ---
  openCreateCategoryModal(): void {
    this.editingCategory.set(null);
    this.categoryError.set(null);
    this.categoryForm.reset({
      nameAr: '',
      nameEn: '',
      displayOrder: this.categories().length + 1,
      isActive: true,
    });
    this.categoryModalOpen.set(true);
  }

  openEditCategoryModal(cat: CategoryManagementDto): void {
    this.editingCategory.set(cat);
    this.categoryError.set(null);
    this.categoryForm.setValue({
      nameAr: cat.nameAr,
      nameEn: cat.nameEn,
      displayOrder: cat.displayOrder,
      isActive: cat.isActive,
    });
    this.categoryModalOpen.set(true);
  }

  closeCategoryModal(): void {
    this.categoryModalOpen.set(false);
    this.editingCategory.set(null);
  }

  saveCategory(): void {
    if (this.categorySaving() || this.categoryForm.invalid) return;

    this.categorySaving.set(true);
    this.categoryError.set(null);

    const val = this.categoryForm.getRawValue();
    const editing = this.editingCategory();

    if (editing) {
      const req: UpdateCategoryRequest = {
        nameAr: val.nameAr.trim(),
        nameEn: val.nameEn.trim(),
        displayOrder: Number(val.displayOrder),
        isActive: val.isActive,
        rowVersion: editing.rowVersion,
      };

      this.api
        .updateCategory(editing.id, req)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.categorySaving.set(false);
            this.closeCategoryModal();
            this.feedbackMessage.set(this.copy().management.categories.updateSuccess);
            this.loadAll();
          },
          error: (err) => {
            this.categorySaving.set(false);
            if (err.status === 409) {
              this.categoryError.set(this.copy().management.categories.staleError);
            } else {
              this.categoryError.set(this.copy().management.categories.error);
            }
          },
        });
    } else {
      const req: CreateCategoryRequest = {
        nameAr: val.nameAr.trim(),
        nameEn: val.nameEn.trim(),
        displayOrder: Number(val.displayOrder),
        isActive: val.isActive,
      };

      this.api
        .createCategory(req)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.categorySaving.set(false);
            this.closeCategoryModal();
            this.feedbackMessage.set(this.copy().management.categories.createSuccess);
            this.loadAll();
          },
          error: () => {
            this.categorySaving.set(false);
            this.categoryError.set(this.copy().management.categories.error);
          },
        });
    }
  }

  toggleCategoryStatus(cat: CategoryManagementDto): void {
    const req: ToggleActiveRequest = {
      isActive: !cat.isActive,
      rowVersion: cat.rowVersion,
    };

    this.api
      .toggleCategoryStatus(cat.id, req)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.feedbackMessage.set(this.copy().management.categories.toggleSuccess);
          this.loadAll();
        },
        error: (err) => {
          if (err.status === 409) {
            this.feedbackMessage.set(this.copy().management.categories.staleError);
            this.loadAll();
          } else {
            this.feedbackMessage.set(this.copy().management.categories.error);
          }
        },
      });
  }

  // --- Menu Item Actions ---
  openCreateItemModal(): void {
    this.editingItem.set(null);
    this.itemError.set(null);
    this.imageError.set(null);
    this.selectedImageFile.set(null);
    this.imagePreviewUrl.set(null);
    this.imageRemoved.set(false);
    this.imageUploading.set(false);
    this.persistedItemIdAfterCreate.set(null);

    const defaultCatId = this.categories().length > 0 ? (this.categories()[0]?.id ?? '') : '';
    this.itemForm.reset({
      categoryId: this.selectedCategoryId() || defaultCatId,
      nameAr: '',
      nameEn: '',
      descriptionAr: '',
      descriptionEn: '',
      price: 50,
      preparationMinutes: 15,
      displayOrder: this.menuItems().length + 1,
      isActive: true,
      isAvailable: true,
    });
    this.itemModalOpen.set(true);
  }

  openEditItemModal(item: MenuItemManagementDto): void {
    this.editingItem.set(item);
    this.itemError.set(null);
    this.imageError.set(null);
    this.selectedImageFile.set(null);
    this.imageRemoved.set(false);
    this.imageUploading.set(false);
    this.persistedItemIdAfterCreate.set(null);

    const hasValidImage = Boolean(
      item.imageReference && item.imageReference !== '/images/menu/default.webp',
    );
    this.imagePreviewUrl.set(hasValidImage ? item.imageReference : null);

    this.itemForm.setValue({
      categoryId: item.categoryId,
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      descriptionAr: item.descriptionAr,
      descriptionEn: item.descriptionEn,
      price: item.price,
      preparationMinutes: item.preparationMinutes,
      displayOrder: item.displayOrder,
      isActive: item.isActive,
      isAvailable: item.isAvailable,
    });
    this.itemModalOpen.set(true);
  }

  closeItemModal(): void {
    this.itemModalOpen.set(false);
    this.editingItem.set(null);
    this.selectedImageFile.set(null);
    this.imagePreviewUrl.set(null);
    this.imageRemoved.set(false);
    this.imageUploading.set(false);
    this.imageError.set(null);
    this.persistedItemIdAfterCreate.set(null);
  }

  // --- Image Card Handlers ---
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (file) {
      this.processSelectedFile(file);
    }
    input.value = '';
  }

  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingOver.set(false);
    if (!event.dataTransfer?.files || event.dataTransfer.files.length === 0) return;
    const file = event.dataTransfer.files[0];
    if (file) {
      this.processSelectedFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingOver.set(false);
  }

  private processSelectedFile(file: File): void {
    this.imageError.set(null);

    // Size check
    if (file.size > this.maxFileSizeBytes || file.size === 0) {
      this.imageError.set(this.copy().management.menuItems.imageTooLarge);
      return;
    }

    // Extension & MIME check
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isAllowedExt = this.allowedExtensions.includes(extension);
    const isAllowedMime = this.allowedMimeTypes.includes(file.type);

    if (!isAllowedExt && !isAllowedMime) {
      this.imageError.set(this.copy().management.menuItems.imageFormatUnsupported);
      return;
    }

    this.selectedImageFile.set(file);
    this.imageRemoved.set(false);

    // Live preview
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreviewUrl.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  requestRemoveImage(): void {
    const editing = this.editingItem();
    // If we only staged a local file, just clear staged file
    if (this.selectedImageFile()) {
      this.selectedImageFile.set(null);
      this.imageError.set(null);
      // Restore previous persisted image if editing
      if (
        editing &&
        editing.imageReference &&
        editing.imageReference !== '/images/menu/default.webp'
      ) {
        this.imagePreviewUrl.set(editing.imageReference);
        this.imageRemoved.set(false);
      } else {
        this.imagePreviewUrl.set(null);
        this.imageRemoved.set(false);
      }
      return;
    }

    // If there is an existing persisted image in an edit session, confirm
    if (editing && this.imagePreviewUrl()) {
      this.removeConfirmModalOpen.set(true);
    } else {
      this.imagePreviewUrl.set(null);
      this.imageRemoved.set(true);
    }
  }

  confirmRemoveImage(): void {
    this.removeConfirmModalOpen.set(false);
    this.imagePreviewUrl.set(null);
    this.selectedImageFile.set(null);
    this.imageRemoved.set(true);
    this.imageError.set(null);
  }

  cancelRemoveImage(): void {
    this.removeConfirmModalOpen.set(false);
  }

  retryImageUpload(): void {
    const pendingItemId = this.persistedItemIdAfterCreate();
    const stagedFile = this.selectedImageFile();
    if (pendingItemId && stagedFile) {
      this.itemSaving.set(true);
      this.itemError.set(null);
      this.uploadStagedImageAndFinish(pendingItemId, stagedFile);
    }
  }

  // --- Save Flow ---
  saveMenuItem(): void {
    if (this.itemSaving() || this.itemForm.invalid) return;

    this.itemSaving.set(true);
    this.itemError.set(null);

    const val = this.itemForm.getRawValue();
    const editing = this.editingItem();

    // Check retry case
    const pendingItemId = this.persistedItemIdAfterCreate();
    const stagedFile = this.selectedImageFile();
    if (pendingItemId && stagedFile) {
      this.uploadStagedImageAndFinish(pendingItemId, stagedFile);
      return;
    }

    if (editing) {
      const req: UpdateMenuItemRequest = {
        categoryId: val.categoryId,
        nameAr: val.nameAr.trim(),
        nameEn: val.nameEn.trim(),
        descriptionAr: val.descriptionAr.trim(),
        descriptionEn: val.descriptionEn.trim(),
        price: Number(val.price),
        imageReference: editing.imageReference,
        preparationMinutes: Number(val.preparationMinutes),
        displayOrder: Number(val.displayOrder),
        isActive: val.isActive,
        isAvailable: val.isAvailable,
        rowVersion: editing.rowVersion,
      };

      this.api
        .updateMenuItem(editing.id, req)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (savedItem) => {
            if (this.selectedImageFile()) {
              this.uploadStagedImageAndFinish(savedItem.id, this.selectedImageFile()!);
            } else if (this.imageRemoved()) {
              this.api
                .deleteMenuItemImage(savedItem.id)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                  next: () => {
                    this.itemSaving.set(false);
                    this.closeItemModal();
                    this.feedbackMessage.set(this.copy().management.menuItems.updateSuccess);
                    this.loadAll();
                  },
                  error: () => {
                    this.itemSaving.set(false);
                    this.closeItemModal();
                    this.feedbackMessage.set(this.copy().management.menuItems.updateSuccess);
                    this.loadAll();
                  },
                });
            } else {
              this.itemSaving.set(false);
              this.closeItemModal();
              this.feedbackMessage.set(this.copy().management.menuItems.updateSuccess);
              this.loadAll();
            }
          },
          error: (err) => {
            this.itemSaving.set(false);
            if (err.status === 409) {
              this.itemError.set(this.copy().management.menuItems.staleError);
            } else {
              this.itemError.set(this.copy().management.menuItems.error);
            }
          },
        });
    } else {
      const req: CreateMenuItemRequest = {
        categoryId: val.categoryId,
        nameAr: val.nameAr.trim(),
        nameEn: val.nameEn.trim(),
        descriptionAr: val.descriptionAr.trim(),
        descriptionEn: val.descriptionEn.trim(),
        price: Number(val.price),
        imageReference: '/images/menu/default.webp',
        preparationMinutes: Number(val.preparationMinutes),
        displayOrder: Number(val.displayOrder),
        isActive: val.isActive,
        isAvailable: val.isAvailable,
      };

      this.api
        .createMenuItem(req)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (createdItem) => {
            if (this.selectedImageFile()) {
              this.persistedItemIdAfterCreate.set(createdItem.id);
              this.uploadStagedImageAndFinish(createdItem.id, this.selectedImageFile()!);
            } else {
              this.itemSaving.set(false);
              this.closeItemModal();
              this.feedbackMessage.set(this.copy().management.menuItems.createSuccess);
              this.loadAll();
            }
          },
          error: () => {
            this.itemSaving.set(false);
            this.itemError.set(this.copy().management.menuItems.error);
          },
        });
    }
  }

  private uploadStagedImageAndFinish(itemId: string, file: File): void {
    this.imageUploading.set(true);
    this.api
      .uploadMenuItemImage(itemId, file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.imageUploading.set(false);
          this.itemSaving.set(false);
          this.closeItemModal();
          this.feedbackMessage.set(
            this.editingItem()
              ? this.copy().management.menuItems.updateSuccess
              : this.copy().management.menuItems.createSuccess,
          );
          this.loadAll();
        },
        error: () => {
          this.imageUploading.set(false);
          this.itemSaving.set(false);
          this.itemError.set(this.copy().management.menuItems.imageUploadFailed);
        },
      });
  }

  toggleItemAvailability(item: MenuItemManagementDto): void {
    const req: ToggleMenuItemAvailabilityRequest = {
      isAvailable: !item.isAvailable,
      rowVersion: item.rowVersion,
    };

    this.api
      .toggleMenuItemAvailability(item.id, req)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.feedbackMessage.set(this.copy().management.menuItems.availabilitySuccess);
          this.loadAll();
        },
        error: (err) => {
          if (err.status === 409) {
            this.feedbackMessage.set(this.copy().management.menuItems.staleError);
            this.loadAll();
          } else {
            this.feedbackMessage.set(this.copy().management.menuItems.error);
          }
        },
      });
  }

  toggleItemStatus(item: MenuItemManagementDto): void {
    const req: ToggleActiveRequest = {
      isActive: !item.isActive,
      rowVersion: item.rowVersion,
    };

    this.api
      .toggleMenuItemStatus(item.id, req)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.feedbackMessage.set(this.copy().management.menuItems.statusSuccess);
          this.loadAll();
        },
        error: (err) => {
          if (err.status === 409) {
            this.feedbackMessage.set(this.copy().management.menuItems.staleError);
            this.loadAll();
          } else {
            this.feedbackMessage.set(this.copy().management.menuItems.error);
          }
        },
      });
  }

  onThumbnailError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  localizedCategory(cat: CategoryManagementDto): string {
    return localizedText(this.language.current(), cat.nameAr, cat.nameEn);
  }

  localizedItem(item: MenuItemManagementDto): string {
    return localizedText(this.language.current(), item.nameAr, item.nameEn);
  }

  money(val: number): string {
    return formatMoney(val, this.language.current());
  }

  @HostListener('document:keydown.escape')
  protected handleEscape(): void {
    if (this.removeConfirmModalOpen()) {
      this.cancelRemoveImage();
    } else if (this.itemModalOpen()) {
      this.closeItemModal();
    } else if (this.categoryModalOpen()) {
      this.closeCategoryModal();
    }
  }

  signOut(): void {
    this.session
      .signOutManagement()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => void this.router.navigate(['/management/sign-in']),
        error: () => void this.router.navigate(['/management/sign-in']),
      });
  }

  setLanguage(lang: 'ar' | 'en'): void {
    this.language.setLanguage(lang);
  }
}
