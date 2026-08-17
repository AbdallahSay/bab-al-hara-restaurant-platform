import { inject, Injectable, signal } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { Subject } from 'rxjs';

import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { DriverOrderDto } from './driver.models';

export type RealtimeStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface DriverHubEvent {
  readonly id?: string;
  readonly orderId?: string;
  readonly publicCode?: string;
  readonly newStatus?: string;
  readonly status?: string;
  readonly rowVersion?: string;
  readonly driverId?: string;
  readonly driverName?: string;
  readonly driverAssignedAtUtc?: string;
}

@Injectable({ providedIn: 'root' })
export class DriverHubService {
  private readonly orderAssigned = new Subject<DriverOrderDto | DriverHubEvent>();
  private readonly orderStatusChanged = new Subject<DriverHubEvent>();
  private readonly orderCompleted = new Subject<string>();
  private readonly reconnected = new Subject<void>();
  private readonly connection: HubConnection;

  readonly status = signal<RealtimeStatus>('disconnected');
  readonly orderAssigned$ = this.orderAssigned.asObservable();
  readonly orderStatusChanged$ = this.orderStatusChanged.asObservable();
  readonly orderCompleted$ = this.orderCompleted.asObservable();
  readonly reconnected$ = this.reconnected.asObservable();

  constructor() {
    const environment = inject(APP_ENVIRONMENT);
    this.connection = new HubConnectionBuilder()
      .withUrl(environment.driverHubUrl, { withCredentials: true })
      .withAutomaticReconnect([0, 2000, 5000, 10_000])
      .configureLogging(LogLevel.Warning)
      .build();

    this.connection.on('DriverAssigned', (evt: DriverHubEvent) => this.orderAssigned.next(evt));
    this.connection.on('OrderAssigned', (evt: DriverOrderDto) => this.orderAssigned.next(evt));
    this.connection.on('OrderStatusChanged', (evt: DriverHubEvent) =>
      this.orderStatusChanged.next(evt),
    );
    this.connection.on('OrderCompleted', (orderId: string) => this.orderCompleted.next(orderId));
    this.connection.onreconnecting(() => this.status.set('reconnecting'));
    this.connection.onreconnected(() => {
      this.status.set('connected');
      this.reconnected.next();
    });
    this.connection.onclose(() => this.status.set('disconnected'));
  }

  async start(): Promise<void> {
    if (this.connection.state !== HubConnectionState.Disconnected) {
      return;
    }

    this.status.set('connecting');
    try {
      await this.connection.start();
      this.status.set('connected');
    } catch (error: unknown) {
      this.status.set('disconnected');
      throw error;
    }
  }

  async stop(): Promise<void> {
    await this.connection.stop();
    this.status.set('disconnected');
  }
}
