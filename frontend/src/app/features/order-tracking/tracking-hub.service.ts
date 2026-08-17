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

  async startConnection(publicCode: string): Promise<void> {
    if (this.connection) {
      await this.stopConnection();
    }

    const hubUrl = `/hubs/order-tracking?publicCode=${encodeURIComponent(publicCode)}`;

    this.connection = new HubConnectionBuilder().withUrl(hubUrl).withAutomaticReconnect().build();

    this.connection.on('OrderTrackingUpdated', (data: CustomerOrderTracking) => {
      this.trackingUpdate$.next(data);
    });

    this.connection.onreconnected(() => {
      this.connectionState$.next(HubConnectionState.Connected);
      this.reconnected$.next();
    });

    this.connection.onclose(() => {
      this.connectionState$.next(HubConnectionState.Disconnected);
    });

    this.connection.onreconnecting(() => {
      this.connectionState$.next(HubConnectionState.Reconnecting);
    });

    try {
      await this.connection.start();
      this.connectionState$.next(HubConnectionState.Connected);
    } catch {
      this.connectionState$.next(HubConnectionState.Disconnected);
    }
  }

  async stopConnection(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch {
        // Safe cleanup
      }
      this.connection = null;
      this.connectionState$.next(HubConnectionState.Disconnected);
    }
  }

  ngOnDestroy(): void {
    void this.stopConnection();
  }
}
