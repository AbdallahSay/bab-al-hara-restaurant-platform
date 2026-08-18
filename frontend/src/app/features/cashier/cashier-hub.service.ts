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
import { CashierOrderStatusChangedEvent, OrderDriverAssignedEvent } from './cashier.models';

export type RealtimeStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

@Injectable({ providedIn: 'root' })
export class CashierHubService {
  private readonly orderCompleted = new Subject<string>();
  private readonly orderDriverAssigned = new Subject<OrderDriverAssignedEvent>();
  private readonly orderStatusChanged = new Subject<CashierOrderStatusChangedEvent>();
  private readonly reconnected = new Subject<void>();
  private readonly connection: HubConnection;
  private startPromise: Promise<void> | null = null;

  readonly status = signal<RealtimeStatus>('disconnected');
  readonly orderCompleted$ = this.orderCompleted.asObservable();
  readonly orderDriverAssigned$ = this.orderDriverAssigned.asObservable();
  readonly orderStatusChanged$ = this.orderStatusChanged.asObservable();
  readonly reconnected$ = this.reconnected.asObservable();

  constructor() {
    const environment = inject(APP_ENVIRONMENT);
    this.connection = new HubConnectionBuilder()
      .withUrl(environment.cashierHubUrl, { withCredentials: true })
      .withAutomaticReconnect(createOperationalRetryPolicy())
      .configureLogging(LogLevel.Warning)
      .build();

    this.connection.on('OrderCompleted', (orderId: string) => this.orderCompleted.next(orderId));
    this.connection.on('OrderDriverAssigned', (payload: unknown, ...rest: unknown[]) => {
      if (typeof payload === 'string') {
        this.orderDriverAssigned.next({
          orderId: payload,
          driverId: typeof rest[0] === 'string' ? rest[0] : '',
          driverName: typeof rest[1] === 'string' ? rest[1] : '',
          driverAssignedAtUtc: typeof rest[2] === 'string' ? rest[2] : undefined,
          rowVersion: typeof rest[3] === 'string' ? rest[3] : undefined,
        });
      } else if (payload && typeof payload === 'object') {
        this.orderDriverAssigned.next(payload as OrderDriverAssignedEvent);
      }
    });
    this.connection.on('OrderStatusChanged', (payload: unknown, ...rest: unknown[]) => {
      if (typeof payload === 'string') {
        this.orderStatusChanged.next({
          orderId: payload,
          newStatus: typeof rest[0] === 'string' ? rest[0] : payload,
          status: typeof rest[0] === 'string' ? rest[0] : payload,
          rowVersion: typeof rest[1] === 'string' ? rest[1] : undefined,
        });
      } else if (payload && typeof payload === 'object') {
        this.orderStatusChanged.next(payload as CashierOrderStatusChangedEvent);
      }
    });
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
