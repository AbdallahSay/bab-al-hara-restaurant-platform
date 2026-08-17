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
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HubConnectionState } from '@microsoft/signalr';

import { formatMoney, localizedText } from '../../core/i18n/formatters';
import { LanguageService } from '../../core/i18n/language.service';
import { CustomerHeader } from '../../shared/customer-header/customer-header';
import { CustomerOrderTracking, OrderStatus, OrderType } from './order-tracking.models';

import { TrackingApiService } from './tracking-api.service';
import { TrackingCredentialService } from './tracking-credential.service';
import { TrackingHubService } from './tracking-hub.service';

type PageState = 'loading' | 'no-credential' | 'error' | 'loaded';

interface StepDef {
  readonly key: OrderStatus;
  readonly label: () => string;
}

@Component({
  selector: 'app-order-tracking-page',
  imports: [CustomerHeader, RouterLink],
  templateUrl: './order-tracking-page.html',
  styleUrl: './order-tracking-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TrackingHubService],
})
export class OrderTrackingPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly credentials = inject(TrackingCredentialService);
  private readonly api = inject(TrackingApiService);
  protected readonly hub = inject(TrackingHubService);
  protected readonly HubConnectionState = HubConnectionState;
  private readonly destroyRef = inject(DestroyRef);
  private publicCode = '';
  private token = '';

  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  protected readonly state = signal<PageState>('loading');
  protected readonly tracking = signal<CustomerOrderTracking | null>(null);
  protected readonly summaryOpen = signal(false);
  protected readonly connectionState = toSignal(this.hub.connectionState$, {
    initialValue: HubConnectionState.Disconnected,
  });
  protected readonly isReconnecting = computed(
    () => this.connectionState() === HubConnectionState.Reconnecting,
  );

  protected readonly deliverySteps: readonly StepDef[] = [
    { key: 'Pending', label: () => this.copy().orderTracking.steps.pending },
    { key: 'Confirmed', label: () => this.copy().orderTracking.steps.confirmed },
    { key: 'Preparing', label: () => this.copy().orderTracking.steps.preparing },
    { key: 'Ready', label: () => this.copy().orderTracking.steps.readyDelivery },
    { key: 'OnTheWay', label: () => this.copy().orderTracking.steps.onTheWay },
    { key: 'Delivered', label: () => this.copy().orderTracking.steps.delivered },
  ];

  protected readonly takeawaySteps: readonly StepDef[] = [
    { key: 'Pending', label: () => this.copy().orderTracking.steps.pending },
    { key: 'Confirmed', label: () => this.copy().orderTracking.steps.confirmed },
    { key: 'Preparing', label: () => this.copy().orderTracking.steps.preparing },
    { key: 'Ready', label: () => this.copy().orderTracking.steps.readyTakeaway },
    { key: 'Delivered', label: () => this.copy().orderTracking.steps.delivered },
  ];

  protected readonly currentSteps = computed(() => {
    const t = this.tracking();
    if (!t) return this.deliverySteps;
    return t.orderType === 'Delivery' ? this.deliverySteps : this.takeawaySteps;
  });

  protected readonly statusWording = computed(() => {
    const t = this.tracking();
    if (!t) return '';
    const steps = this.copy().orderTracking.steps;
    switch (t.status) {
      case 'Pending':
        return steps.pending;
      case 'Confirmed':
        return steps.confirmed;
      case 'Preparing':
        return steps.preparing;
      case 'Ready':
        return t.orderType === 'Delivery' ? steps.readyDelivery : steps.readyTakeaway;
      case 'OnTheWay':
        return steps.onTheWay;
      case 'Delivered':
        return steps.delivered;
      default:
        return '';
    }
  });

  ngOnInit(): void {
    this.publicCode = this.route.snapshot.params['publicCode'] as string;
    this.token = this.credentials.getToken(this.publicCode) ?? '';

    if (!this.token) {
      this.state.set('no-credential');
      return;
    }

    this.loadTracking();
  }

  ngOnDestroy(): void {
    void this.hub.stopConnection();
  }

  protected loadTracking(): void {
    this.state.set('loading');
    this.api
      .getTracking(this.publicCode, this.token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.tracking.set(data);
          this.state.set('loaded');
          void this.connectHub();
        },
        error: () => {
          this.state.set('error');
        },
      });
  }

  protected toggleSummary(): void {
    this.summaryOpen.update((v) => !v);
  }

  protected getStepClass(
    stepKey: OrderStatus,
    currentStatus: OrderStatus,
    timeline: readonly { readonly status: OrderStatus }[],
  ): 'completed' | 'current' | 'pending' {
    if (stepKey === currentStatus) return 'current';
    const statusOrder: readonly OrderStatus[] = [
      'Pending',
      'Confirmed',
      'Preparing',
      'Ready',
      'OnTheWay',
      'Delivered',
    ];
    const stepIdx = statusOrder.indexOf(stepKey);
    const currentIdx = statusOrder.indexOf(currentStatus);
    const inTimeline = timeline.some((e) => e.status === stepKey);
    if (inTimeline || stepIdx < currentIdx) return 'completed';
    return 'pending';
  }

  protected formatMoney(value: number): string {
    return formatMoney(value, this.language.current());
  }

  protected localizedText(arabic: string | null, english: string | null): string {
    return localizedText(this.language.current(), arabic ?? '', english ?? '');
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat(this.language.current() === 'ar' ? 'ar-EG' : 'en-EG', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  }

  protected orderTypeLabel(type: OrderType): string {
    return type === 'Takeaway' ? this.copy().common.takeaway : this.copy().common.delivery;
  }

  private async connectHub(): Promise<void> {
    try {
      await this.hub.startConnection(this.token);
    } catch {
      // Hub failure is non-fatal — REST polling would be the fallback.
      // The connectivity banner covers transient disconnects.
      return;
    }

    this.hub.trackingUpdate$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      this.tracking.set(data);
    });

    this.hub.reconnected$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.api
        .getTracking(this.publicCode, this.token)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => this.tracking.set(data),
          error: () => undefined,
        });
    });

    this.hub.connectionState$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      // Triggers change detection for connectivity banner
    });
  }
}
