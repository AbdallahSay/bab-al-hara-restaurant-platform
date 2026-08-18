import { inject, Injectable, signal } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { Subject } from 'rxjs';

import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { createOperationalRetryPolicy } from '../../core/realtime/realtime-retry-policy';
import {
  KitchenOrder,
  MenuItemAvailabilityChangedEvent,
  OrderStatusChangedEvent,
} from '../customer-ordering/order.models';

export type RealtimeStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

@Injectable({ providedIn: 'root' })
export class KitchenRealtimeService {
  private readonly newOrders = new Subject<KitchenOrder>();
  private readonly statusChanged = new Subject<OrderStatusChangedEvent>();
  private readonly availabilityChanged = new Subject<MenuItemAvailabilityChangedEvent>();
  private readonly reconnected = new Subject<void>();
  private readonly connection: HubConnection;
  private startPromise: Promise<void> | null = null;

  readonly status = signal<RealtimeStatus>('disconnected');
  readonly newOrders$ = this.newOrders.asObservable();
  readonly statusChanged$ = this.statusChanged.asObservable();
  readonly availabilityChanged$ = this.availabilityChanged.asObservable();
  readonly reconnected$ = this.reconnected.asObservable();

  constructor() {
    const environment = inject(APP_ENVIRONMENT);
    this.connection = new HubConnectionBuilder()
      .withUrl(environment.kitchenHubUrl, { withCredentials: true })
      .withAutomaticReconnect(createOperationalRetryPolicy())
      .configureLogging(LogLevel.Warning)
      .build();

    this.connection.on('NewOrder', (order: KitchenOrder) => this.newOrders.next(order));
    this.connection.on('OrderStatusChanged', (event: OrderStatusChangedEvent) =>
      this.statusChanged.next(event),
    );
    this.connection.on('MenuItemAvailabilityChanged', (event: MenuItemAvailabilityChangedEvent) =>
      this.availabilityChanged.next(event),
    );
    this.connection.onreconnecting(() => this.status.set('reconnecting'));
    this.connection.onreconnected(() => {
      this.status.set('connected');
      this.reconnected.next();
    });
    this.connection.onclose(() => this.status.set('disconnected'));
  }

  async start(): Promise<void> {
    if (this.connection.state === HubConnectionState.Connected) {
      this.status.set('connected');
      return;
    }

    if (this.startPromise) {
      return this.startPromise;
    }

    if (this.connection.state === HubConnectionState.Connecting) {
      this.status.set('connecting');
      return;
    }

    this.status.set('connecting');
    this.startPromise = this.connection
      .start()
      .then(() => {
        this.status.set('connected');
      })
      .catch((error: unknown) => {
        this.status.set('disconnected');
        throw error;
      })
      .finally(() => {
        this.startPromise = null;
      });

    return this.startPromise;
  }

  async stop(): Promise<void> {
    this.startPromise = null;
    if (this.connection.state !== HubConnectionState.Disconnected) {
      await this.connection.stop();
    }
    this.status.set('disconnected');
  }
}
