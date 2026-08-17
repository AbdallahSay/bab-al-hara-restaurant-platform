import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { LanguageService } from '../../../core/i18n/language.service';
import { StaffSessionService } from '../../kitchen/staff-session.service';
import { ManagementApiService } from '../management-api.service';
import { CategoryManagementDto, MenuItemManagementDto } from '../management.models';
import { RestaurantStatusCardComponent } from '../restaurant-status-card/restaurant-status-card.component';

@Component({
  selector: 'app-management-hub-page',
  standalone: true,
  imports: [RestaurantStatusCardComponent, RouterLink],
  templateUrl: './management-hub-page.html',
  styleUrl: './management-hub-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagementHubPage implements OnInit {
  private readonly api = inject(ManagementApiService);
  private readonly session = inject(StaffSessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly categories = signal<readonly CategoryManagementDto[]>([]);
  protected readonly menuItems = signal<readonly MenuItemManagementDto[]>([]);

  protected readonly activeCategoriesCount = computed(
    () => this.categories().filter((c) => c.isActive).length,
  );
  protected readonly availableItemsCount = computed(
    () => this.menuItems().filter((i) => i.isAvailable && i.isActive).length,
  );
  protected readonly soldOutItemsCount = computed(
    () => this.menuItems().filter((i) => !i.isAvailable && i.isActive).length,
  );
  protected readonly archivedItemsCount = computed(
    () => this.menuItems().filter((i) => !i.isActive).length,
  );

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
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
