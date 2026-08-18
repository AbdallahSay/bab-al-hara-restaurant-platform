import { IRetryPolicy, RetryContext } from '@microsoft/signalr';

/**
 * Resilient exponential backoff retry policy for operational SignalR connections.
 * Retries immediately first, then with increasing backoffs up to maxDelayMs,
 * continuing indefinitely so kitchen, cashier, driver, and operations screens
 * automatically recover from transient network drops without manual page refreshes.
 */
export class ExponentialBackoffRetryPolicy implements IRetryPolicy {
  constructor(
    private readonly initialDelays: readonly number[] = [0, 2000, 5000, 10_000, 15_000, 30_000],
    private readonly maxDelayMs: number = 30_000,
  ) {}

  nextRetryDelayInMilliseconds(retryContext: RetryContext): number | null {
    if (retryContext.previousRetryCount >= 0 && retryContext.previousRetryCount < this.initialDelays.length) {
      const delay = this.initialDelays[retryContext.previousRetryCount];
      if (typeof delay === 'number') {
        return delay;
      }
    }
    return this.maxDelayMs;
  }
}

export function createOperationalRetryPolicy(): IRetryPolicy {
  return new ExponentialBackoffRetryPolicy();
}
