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

export type OperationsRealtimeStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface OperationsOrderStatusChangedEvent {
  readonly publicCode: string;
  readonly previousStatus: string;
  readonly newStatus: string;
  readonly changedAtUtc: string;
  readonly rowVersion?: string | null;
}

export interface OperationsDriverAssignedEvent {
  readonly publicCode: string;
  readonly driverId: string;
  readonly driverName: string;
  readonly assignedAtUtc: string;
  readonly rowVersion?: string | null;
}

@Injectable({ providedIn: 'root' })
export class OperationsRealtimeService {
  private readonly operationsUpdated = new Subject<void>();
  private readonly orderCreated = new Subject<string>();
  private readonly orderStatusChanged = new Subject<OperationsOrderStatusChangedEvent>();
  private readonly driverAssigned = new Subject<OperationsDriverAssignedEvent>();
  private readonly reconnected = new Subject<void>();
  private readonly connection: HubConnection;
  private startPromise: Promise<void> | null = null;

  readonly status = signal<OperationsRealtimeStatus>('disconnected');
  readonly operationsUpdated$ = this.operationsUpdated.asObservable();
  readonly orderCreated$ = this.orderCreated.asObservable();
  readonly orderStatusChanged$ = this.orderStatusChanged.asObservable();
  readonly driverAssigned$ = this.driverAssigned.asObservable();
  readonly reconnected$ = this.reconnected.asObservable();

  constructor() {
    const environment = inject(APP_ENVIRONMENT);
    this.connection = new HubConnectionBuilder()
      .withUrl(environment.operationsHubUrl, { withCredentials: true })
      .withAutomaticReconnect(createOperationalRetryPolicy())
      .configureLogging(LogLevel.Warning)
      .build();

    this.connection.on('OperationsUpdated', () => this.operationsUpdated.next());
    this.connection.on('OrderCreated', (publicCode: string) => this.orderCreated.next(publicCode));
    this.connection.on('OrderStatusChanged', (event: OperationsOrderStatusChangedEvent) =>
      this.orderStatusChanged.next(event),
    );
    this.connection.on('DriverAssigned', (event: OperationsDriverAssignedEvent) =>
      this.driverAssigned.next(event),
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
