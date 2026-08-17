import { Injectable, OnDestroy } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';

import { CustomerOrderTracking } from './order-tracking.models';

@Injectable()
export class TrackingHubService implements OnDestroy {
  private connection: HubConnection | null = null;
  readonly connectionState$ = new BehaviorSubject<HubConnectionState>(
    HubConnectionState.Disconnected,
  );
  readonly trackingUpdate$ = new Subject<CustomerOrderTracking>();
  readonly reconnected$ = new Subject<void>();

  async startConnection(token: string): Promise<void> {
    this.connection = new HubConnectionBuilder()
      .withUrl('/hubs/order-tracking', { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    this.connection.on('OrderTrackingUpdated', (data: CustomerOrderTracking) => {
      this.trackingUpdate$.next(data);
    });

    this.connection.onreconnected(() => {
      this.reconnected$.next();
    });

    this.connection.onclose(() => {
      this.connectionState$.next(HubConnectionState.Disconnected);
    });

    this.connection.onreconnecting(() => {
      this.connectionState$.next(HubConnectionState.Reconnecting);
    });

    await this.connection.start();
    this.connectionState$.next(HubConnectionState.Connected);
  }

  async stopConnection(): Promise<void> {
    await this.connection?.stop();
    this.connection = null;
  }

  ngOnDestroy(): void {
    void this.stopConnection();
  }
}
