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
import { KitchenOrder, KitchenOrderItem } from '../customer-ordering/order.models';
import { KitchenApiService } from './kitchen-api.service';
import { KitchenRealtimeService } from './kitchen-realtime.service';
import { StaffSessionService } from './staff-session.service';

type QueueState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-kitchen-page',
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

  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  protected readonly realtime = inject(KitchenRealtimeService);
  protected readonly state = signal<QueueState>('loading');
  protected readonly orders = signal<readonly KitchenOrder[]>([]);
  protected readonly soundEnabled = signal(false);
  protected readonly newOrderCode = signal<string | null>(null);
  protected readonly now = signal(Date.now());
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
            void this.router.navigate(['/kitchen/sign-in']);
            return;
          }
          this.startQueue();
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
  }

  protected setLanguage(language: Language): void {
    this.language.setLanguage(language);
  }

  protected loadOrders(): void {
    this.state.set('loading');
    this.api
      .getActiveOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
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

  protected enableSound(): void {
    this.audioContext ??= new AudioContext();
    void this.audioContext.resume();
    this.soundEnabled.set(true);
  }

  protected signOut(): void {
    this.sessions
      .signOut()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => void this.router.navigate(['/kitchen/sign-in']) });
  }

  protected orderType(order: KitchenOrder): string {
    return order.orderType === 'Takeaway'
      ? this.copy().common.takeaway
      : this.copy().common.delivery;
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

  private startQueue(): void {
    this.loadOrders();
    this.realtime.newOrders$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((order) => this.receiveOrder(order));
    this.realtime.reconnected$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadOrders());
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
