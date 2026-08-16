import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { interval } from 'rxjs';

import { localizedText } from '../../core/i18n/formatters';
import { LanguageService } from '../../core/i18n/language.service';
import { Language } from '../../core/i18n/translations';
import { CashierApiService } from './cashier-api.service';
import { CashierHubService } from './cashier-hub.service';
import { CashierOrderDto, CashierOrderItemDto } from './cashier.models';
import { StaffSessionService } from '../kitchen/staff-session.service';

type PageState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-cashier-page',
  templateUrl: './cashier-page.html',
  styleUrl: './cashier-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashierPage implements OnInit, OnDestroy {
  private readonly api = inject(CashierApiService);
  private readonly sessions = inject(StaffSessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  protected readonly realtime = inject(CashierHubService);
  protected readonly state = signal<PageState>('loading');
  protected readonly orders = signal<readonly CashierOrderDto[]>([]);
  protected readonly now = signal(Date.now());
  
  protected readonly inFlightHandoffs = signal<Set<string>>(new Set());
  protected readonly staleOrders = signal<Set<string>>(new Set());
  protected readonly errorOrders = signal<Set<string>>(new Set());

  // Simple state for confirming handoff inline. Maps orderId -> boolean
  protected readonly confirmingOrders = signal<Set<string>>(new Set());

  protected readonly sortedOrders = computed(() =>
    [...this.orders()].sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    ),
  );

  ngOnInit(): void {
    this.sessions
      .getSession()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          if (!session.isAuthenticated) {
            void this.router.navigate(['/cashier/sign-in']);
            return;
          }
          this.startSync();
        },
        error: () => void this.router.navigate(['/cashier/sign-in']),
      });

    interval(30_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.now.set(Date.now()));
  }

  ngOnDestroy(): void {
    void this.realtime.stop();
  }

  protected setLanguage(language: Language): void {
    this.language.setLanguage(language);
  }

  protected loadOrders(): void {
    this.state.set('loading');
    this.api
      .getReadyOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
          this.state.set('ready');
          this.confirmingOrders.set(new Set());
          this.inFlightHandoffs.set(new Set());
          this.staleOrders.set(new Set());
          this.errorOrders.set(new Set());
        },
        error: (error: { readonly status?: number }) => {
          if (error.status === 401 || error.status === 403) {
            void this.router.navigate(['/cashier/sign-in']);
          } else {
            this.state.set('error');
          }
        },
      });
  }

  protected signOut(): void {
    this.sessions
      .signOut()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => void this.router.navigate(['/cashier/sign-in']) });
  }

  protected orderType(order: CashierOrderDto): string {
    return order.orderType === 'Takeaway'
      ? this.copy().cashier.takeaway
      : this.copy().cashier.delivery;
  }

  protected areaName(order: CashierOrderDto): string {
    return localizedText(
      this.language.current(),
      order.deliveryAreaNameAr ?? '',
      order.deliveryAreaNameEn ?? '',
    );
  }

  protected itemName(item: CashierOrderItemDto): string {
    return localizedText(this.language.current(), item.productNameAr, item.productNameEn);
  }

  protected elapsedMinutes(value: string): number {
    return Math.max(0, Math.floor((this.now() - new Date(value).getTime()) / 60_000));
  }

  protected elapsedLabel(value: string): string {
    const minutes = this.elapsedMinutes(value);
    return `${minutes} ${minutes === 1 ? this.copy().cashier.minute : this.copy().cashier.minutes}`;
  }

  protected realtimeLabel(): string {
    return this.copy().cashier[this.realtime.status()];
  }

  protected initiateHandoff(orderId: string): void {
    const newConfirming = new Set(this.confirmingOrders());
    newConfirming.add(orderId);
    this.confirmingOrders.set(newConfirming);
    
    // Clear any previous errors for this order
    const newStale = new Set(this.staleOrders());
    newStale.delete(orderId);
    this.staleOrders.set(newStale);
    
    const newErrors = new Set(this.errorOrders());
    newErrors.delete(orderId);
    this.errorOrders.set(newErrors);
  }

  protected cancelHandoff(orderId: string): void {
    const newConfirming = new Set(this.confirmingOrders());
    newConfirming.delete(orderId);
    this.confirmingOrders.set(newConfirming);
  }

  protected confirmHandoff(order: CashierOrderDto): void {
    if (this.inFlightHandoffs().has(order.id)) return;

    const newInFlight = new Set(this.inFlightHandoffs());
    newInFlight.add(order.id);
    this.inFlightHandoffs.set(newInFlight);

    this.api
      .completeCashTakeaway(order.id, order.rowVersion)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        const inFlight = new Set(this.inFlightHandoffs());
        inFlight.delete(order.id);
        this.inFlightHandoffs.set(inFlight);

        if (result === 'success') {
          this.removeOrder(order.id);
        } else if (result === 'stale') {
          const stale = new Set(this.staleOrders());
          stale.add(order.id);
          this.staleOrders.set(stale);
          
          const confirming = new Set(this.confirmingOrders());
          confirming.delete(order.id);
          this.confirmingOrders.set(confirming);
          
          // Reload orders after a delay to get the latest
          setTimeout(() => this.loadOrders(), 3000);
        } else {
          const errors = new Set(this.errorOrders());
          errors.add(order.id);
          this.errorOrders.set(errors);
        }
      });
  }

  private startSync(): void {
    this.loadOrders();
    this.realtime.orderCompleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((orderId) => this.removeOrder(orderId));
    this.realtime.reconnected$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadOrders());
    void this.realtime.start().catch(() => undefined);
  }

  private removeOrder(orderId: string): void {
    this.orders.update((orders) => orders.filter((o) => o.id !== orderId));
  }
}
