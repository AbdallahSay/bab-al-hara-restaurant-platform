import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TrackingCredentialService {
  private readonly keyPrefix = 'bah_tracking_';

  store(publicCode: string, token: string): void {
    sessionStorage.setItem(`${this.keyPrefix}${publicCode}`, token);
  }

  getToken(publicCode: string): string | null {
    return sessionStorage.getItem(`${this.keyPrefix}${publicCode}`);
  }

  clear(publicCode: string): void {
    sessionStorage.removeItem(`${this.keyPrefix}${publicCode}`);
  }
}
