import { Injectable, OnDestroy } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';

import { createOperationalRetryPolicy } from '../../core/realtime/realtime-retry-policy';
import { CustomerOrderTracking } from './order-tracking.models';

@Injectable()
export class TrackingHubService implements OnDestroy {
  private connection: HubConnection | null = null;
  private startPromise: Promise<void> | null = null;
  private currentPublicCode: string | null = null;

  readonly connectionState$ = new BehaviorSubject<HubConnectionState>(
    HubConnectionState.Disconnected,
  );
  readonly trackingUpdate$ = new Subject<CustomerOrderTracking>();
  readonly reconnected$ = new Subject<void>();

  async startConnection(publicCode: string): Promise<void> {
    if (this.connection && this.currentPublicCode === publicCode) {
      if (this.connection.state === HubConnectionState.Connected) {
        this.connectionState$.next(HubConnectionState.Connected);
        return;
      }
      if (this.startPromise) {
        return this.startPromise;
      }
    }

    if (this.connection) {
      await this.stopConnection();
    }

    this.currentPublicCode = publicCode;
    const hubUrl = `/hubs/order-tracking?publicCode=${encodeURIComponent(publicCode)}`;

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect(createOperationalRetryPolicy())
      .configureLogging(LogLevel.Warning)
      .build();

    this.connection = connection;

    connection.on('OrderTrackingUpdated', (data: CustomerOrderTracking) => {
      this.trackingUpdate$.next(data);
    });

    connection.onreconnected(() => {
      this.connectionState$.next(HubConnectionState.Connected);
      this.reconnected$.next();
    });

    connection.onclose(() => {
      this.connectionState$.next(HubConnectionState.Disconnected);
    });

    connection.onreconnecting(() => {
      this.connectionState$.next(HubConnectionState.Reconnecting);
    });

    this.connectionState$.next(HubConnectionState.Connecting);
    this.startPromise = connection
      .start()
      .then(() => {
        this.connectionState$.next(HubConnectionState.Connected);
      })
      .catch((err) => {
        this.connectionState$.next(HubConnectionState.Disconnected);
        throw err;
      })
      .finally(() => {
        this.startPromise = null;
      });

    return this.startPromise;
  }

  async stopConnection(): Promise<void> {
    this.startPromise = null;
    this.currentPublicCode = null;
    if (this.connection) {
      const conn = this.connection;
      this.connection = null;
      try {
        if (conn.state !== HubConnectionState.Disconnected) {
          await conn.stop();
        }
      } catch {
        // Safe cleanup
      }
      this.connectionState$.next(HubConnectionState.Disconnected);
    }
  }

  ngOnDestroy(): void {
    void this.stopConnection();
  }
}
