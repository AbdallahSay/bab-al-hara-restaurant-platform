import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { interval } from 'rxjs';

import { localizedText } from '../../core/i18n/formatters';
import { LanguageService } from '../../core/i18n/language.service';
import { Language } from '../../core/i18n/translations';
import {
  Category,
  KitchenOrder,
  KitchenOrderItem,
  MenuItem,
  OrderStatus,
} from '../customer-ordering/order.models';
import { KitchenApiService } from './kitchen-api.service';
import { KitchenRealtimeService } from './kitchen-realtime.service';
import { StaffSessionService } from './staff-session.service';

type QueueState = 'loading' | 'ready' | 'error';
type FilterStatus = 'ALL' | 'Pending' | 'Confirmed' | 'Preparing' | 'Ready';

@Component({
  selector: 'app-kitchen-page',
  imports: [FormsModule],
  templateUrl: './kitchen-page.html',
  styleUrl: './kitchen-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitchenPage implements OnInit, OnDestroy {
  private readonly api = inject(KitchenApiService);
  private readonly sessions = inject(StaffSessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private audioContext?: AudioContext;
  private toastTimer?: ReturnType<typeof setTimeout>;

  protected readonly localizedText = localizedText;
  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  protected readonly realtime = inject(KitchenRealtimeService);
  protected readonly state = signal<QueueState>('loading');
  protected readonly orders = signal<readonly KitchenOrder[]>([]);
  protected readonly menuItems = signal<readonly MenuItem[]>([]);
  protected readonly categories = signal<readonly Category[]>([]);
  protected readonly activeFilter = signal<FilterStatus>('ALL');
  protected readonly searchQuery = signal('');
  protected readonly submittingCodes = signal<readonly string[]>([]);
  protected readonly toastMessage = signal<string | null>(null);
  protected readonly toastType = signal<'success' | 'warning' | 'error'>('success');
  protected readonly soundEnabled = signal(false);
  protected readonly newOrderCode = signal<string | null>(null);
  protected readonly now = signal(Date.now());

  // Availability Management State
  protected readonly isAvailabilityModalOpen = signal(false);
  protected readonly availabilitySearch = signal('');
  protected readonly selectedAvailabilityCategory = signal<string>('ALL');
  protected readonly pendingAvailabilityToggle = signal<{
    readonly item: MenuItem;
    readonly nextStatus: boolean;
  } | null>(null);
  protected readonly isSavingAvailability = signal(false);

  // Status counts
  protected readonly allCount = computed(() => this.orders().length);
  protected readonly pendingCount = computed(
    () => this.orders().filter((o) => o.status === 'Pending').length,
  );
  protected readonly confirmedCount = computed(
    () => this.orders().filter((o) => o.status === 'Confirmed').length,
  );
  protected readonly preparingCount = computed(
    () => this.orders().filter((o) => o.status === 'Preparing').length,
  );
  protected readonly readyCount = computed(
    () => this.orders().filter((o) => o.status === 'Ready').length,
  );
  protected readonly unavailableCount = computed(
    () => this.menuItems().filter((i) => !i.isAvailable).length,
  );

  protected readonly sortedOrders = computed(() =>
    [...this.orders()].sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    ),
  );

  protected readonly filteredOrders = computed(() => {
    const filter = this.activeFilter();
    const query = this.searchQuery().trim().toLowerCase();
    return this.sortedOrders().filter((order) => {
      const matchesFilter = filter === 'ALL' || order.status === filter;
      if (!matchesFilter) return false;
      if (!query) return true;
      return (
        order.publicCode.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query)
      );
    });
  });

  protected readonly filteredMenuItems = computed(() => {
    const category = this.selectedAvailabilityCategory();
    const query = this.availabilitySearch().trim().toLowerCase();
    return this.menuItems().filter((item) => {
      const matchesCategory = category === 'ALL' || item.categoryId === category;
      if (!matchesCategory) return false;
      if (!query) return true;
      const nameAr = item.nameAr.toLowerCase();
      const nameEn = item.nameEn.toLowerCase();
      return nameAr.includes(query) || nameEn.includes(query);
    });
  });

  ngOnInit(): void {
    this.sessions
      .getKitchenSession()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          if (!session.isAuthenticated) {
            void this.router.navigate(['/kitchen/sign-in']);
            return;
          }
          this.startQueue();
          this.loadCatalog();
        },
        error: () => void this.router.navigate(['/kitchen/sign-in']),
      });

    interval(30_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.now.set(Date.now()));
  }

  ngOnDestroy(): void {
    void this.realtime.stop();
    void this.audioContext?.close();
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  protected setLanguage(language: Language): void {
    this.language.setLanguage(language);
  }

  protected setFilter(filter: FilterStatus): void {
    this.activeFilter.set(filter);
  }

  protected loadOrders(): void {
    if (this.orders().length === 0) {
      this.state.set('loading');
    }
    this.api
      .getActiveOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => {
          this.orders.set(this.deduplicateOrders(orders));
          this.state.set('ready');
        },
        error: (error: { readonly status?: number }) => {
          if (error.status === 401 || error.status === 403) {
            void this.router.navigate(['/kitchen/sign-in']);
          } else {
            this.state.set('error');
          }
        },
      });
  }

  protected loadCatalog(): void {
    this.api
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => this.categories.set(categories),
        error: () => undefined,
      });

    this.api
      .getMenuItems()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => this.menuItems.set(items),
        error: () => undefined,
      });
  }

  protected isSubmitting(publicCode: string): boolean {
    return this.submittingCodes().includes(publicCode);
  }

  protected advanceOrder(order: KitchenOrder): void {
    if (this.isSubmitting(order.publicCode)) {
      return;
    }

    this.submittingCodes.update((codes) => [...codes, order.publicCode]);

    let request$;
    if (order.status === 'Pending') {
      request$ = this.api.confirmOrder(order.publicCode);
    } else if (order.status === 'Confirmed') {
      request$ = this.api.startPreparing(order.publicCode);
    } else if (order.status === 'Preparing') {
      request$ = this.api.markReady(order.publicCode);
    } else {
      this.clearSubmitting(order.publicCode);
      return;
    }

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updatedOrder) => {
        this.clearSubmitting(order.publicCode);
        this.updateOrderInList(updatedOrder);
        this.showToast(this.getStatusSuccessMessage(updatedOrder.status), 'success');
      },
      error: (error: { readonly status?: number }) => {
        this.clearSubmitting(order.publicCode);
        if (error.status === 409) {
          this.showToast(this.copy().kitchen.orderUpdatedByOther, 'warning');
          this.loadOrders();
        } else if (error.status === 401 || error.status === 403) {
          void this.router.navigate(['/kitchen/sign-in']);
        } else {
          this.showToast(this.copy().kitchen.actionError, 'error');
        }
      },
    });
  }

  protected openAvailabilityModal(): void {
    if (this.menuItems().length === 0) {
      this.loadCatalog();
    }
    this.isAvailabilityModalOpen.set(true);
  }

  protected closeAvailabilityModal(): void {
    this.isAvailabilityModalOpen.set(false);
    this.pendingAvailabilityToggle.set(null);
    this.availabilitySearch.set('');
    this.selectedAvailabilityCategory.set('ALL');
  }

  protected requestToggleAvailability(item: MenuItem): void {
    this.pendingAvailabilityToggle.set({ item, nextStatus: !item.isAvailable });
  }

  protected cancelToggleAvailability(): void {
    this.pendingAvailabilityToggle.set(null);
  }

  protected confirmToggleAvailability(): void {
    const pending = this.pendingAvailabilityToggle();
    if (!pending || this.isSavingAvailability()) {
      return;
    }

    this.isSavingAvailability.set(true);
    this.api
      .updateMenuItemAvailability(pending.item.id, pending.nextStatus)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.isSavingAvailability.set(false);
          this.pendingAvailabilityToggle.set(null);
          this.menuItems.update((items) =>
            items.map((it) =>
              it.id === result.id ? { ...it, isAvailable: result.isAvailable } : it,
            ),
          );
          this.showToast(this.copy().kitchen.availabilityUpdated, 'success');
        },
        error: () => {
          this.isSavingAvailability.set(false);
          this.showToast(this.copy().kitchen.availabilityError, 'error');
        },
      });
  }

  protected enableSound(): void {
    this.audioContext ??= new AudioContext();
    void this.audioContext.resume();
    this.soundEnabled.set(true);
  }

  @HostListener('document:keydown.escape')
  protected handleEscape(): void {
    if (this.pendingAvailabilityToggle()) {
      this.cancelToggleAvailability();
    } else if (this.isAvailabilityModalOpen()) {
      this.closeAvailabilityModal();
    }
  }

  protected signOut(): void {
    this.sessions
      .signOutKitchen()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => void this.router.navigate(['/kitchen/sign-in']) });
  }

  protected orderType(order: KitchenOrder): string {
    return order.orderType === 'Takeaway'
      ? this.copy().kitchen.takeawayBadge
      : this.copy().kitchen.deliveryBadge;
  }

  protected areaName(order: KitchenOrder): string {
    return localizedText(
      this.language.current(),
      order.deliveryAreaNameAr ?? '',
      order.deliveryAreaNameEn ?? '',
    );
  }

  protected itemName(item: KitchenOrderItem): string {
    return localizedText(this.language.current(), item.productNameAr, item.productNameEn);
  }

  protected menuItemName(item: MenuItem): string {
    return localizedText(this.language.current(), item.nameAr, item.nameEn);
  }

  protected categoryName(categoryId: string): string {
    const cat = this.categories().find((c) => c.id === categoryId);
    if (!cat) return '';
    return localizedText(this.language.current(), cat.nameAr, cat.nameEn);
  }

  protected receivedAt(value: string): string {
    return new Intl.DateTimeFormat(this.language.current() === 'ar' ? 'ar-EG' : 'en-EG', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  }

  protected elapsedMinutes(value: string): number {
    return Math.max(0, Math.floor((this.now() - new Date(value).getTime()) / 60_000));
  }

  protected elapsedLabel(value: string): string {
    const minutes = this.elapsedMinutes(value);
    return `${minutes} ${minutes === 1 ? this.copy().kitchen.minute : this.copy().kitchen.minutes}`;
  }

  protected realtimeLabel(): string {
    return this.copy().kitchen[this.realtime.status()];
  }

  protected getNextActionLabel(status: OrderStatus): string {
    switch (status) {
      case 'Pending':
        return this.copy().kitchen.confirmOrder;
      case 'Confirmed':
        return this.copy().kitchen.startPreparing;
      case 'Preparing':
        return this.copy().kitchen.markReady;
      default:
        return this.copy().kitchen.readyForPickup;
    }
  }

  private clearSubmitting(publicCode: string): void {
    this.submittingCodes.update((codes) => codes.filter((c) => c !== publicCode));
  }

  private deduplicateOrders(orders: readonly KitchenOrder[]): readonly KitchenOrder[] {
    const seen = new Set<string>();
    const result: KitchenOrder[] = [];
    for (const order of orders) {
      if (!seen.has(order.publicCode)) {
        seen.add(order.publicCode);
        result.push(order);
      }
    }
    return result;
  }

  private updateOrderInList(updatedOrder: KitchenOrder): void {
    this.orders.update((orders) => {
      const exists = orders.some((o) => o.publicCode === updatedOrder.publicCode);
      if (exists) {
        return orders.map((o) => (o.publicCode === updatedOrder.publicCode ? updatedOrder : o));
      }
      return [...orders, updatedOrder];
    });
  }

  private getStatusSuccessMessage(status: OrderStatus): string {
    return `${this.copy().kitchen.status[status]}`;
  }

  private showToast(message: string, type: 'success' | 'warning' | 'error' = 'success'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }

  private startQueue(): void {
    this.loadOrders();

    this.realtime.newOrders$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((order) => this.receiveOrder(order));

    this.realtime.statusChanged$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      this.orders.update((orders) => {
        if (event.status === 'Delivered' || event.status === 'OnTheWay') {
          return orders.filter((o) => o.publicCode !== event.publicCode);
        }
        return orders.map((o) =>
          o.publicCode === event.publicCode ? { ...o, status: event.status } : o,
        );
      });
    });

    this.realtime.availabilityChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.menuItems.update((items) =>
          items.map((it) =>
            it.id === event.menuItemId ? { ...it, isAvailable: event.isAvailable } : it,
          ),
        );
      });

    this.realtime.reconnected$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadOrders();
      this.loadCatalog();
    });

    void this.realtime.start().catch(() => undefined);
  }

  private receiveOrder(order: KitchenOrder): void {
    this.orders.update((orders) => {
      const withoutExisting = orders.filter(
        (candidate) => candidate.publicCode !== order.publicCode,
      );
      return [...withoutExisting, order];
    });
    this.state.set('ready');
    this.newOrderCode.set(order.publicCode);
    this.playAlert();
    globalThis.setTimeout(() => {
      if (this.newOrderCode() === order.publicCode) {
        this.newOrderCode.set(null);
      }
    }, 10_000);
  }

  private playAlert(): void {
    if (!this.soundEnabled() || !this.audioContext) {
      return;
    }

    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    oscillator.frequency.value = 740;
    gain.gain.setValueAtTime(0.18, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.45);
    oscillator.connect(gain);
    gain.connect(this.audioContext.destination);
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.45);
  }
}
