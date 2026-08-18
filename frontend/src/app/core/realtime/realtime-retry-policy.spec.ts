import { RetryContext } from '@microsoft/signalr';
import {
  createOperationalRetryPolicy,
  ExponentialBackoffRetryPolicy,
} from './realtime-retry-policy';

describe('ExponentialBackoffRetryPolicy', () => {
  it('should step through initial delay intervals and clamp to maxDelayMs', () => {
    const policy = new ExponentialBackoffRetryPolicy([0, 2000, 5000, 10000], 30000);

    const ctx0: RetryContext = {
      previousRetryCount: 0,
      retryReason: new Error('test'),
      elapsedMilliseconds: 0,
    };
    const ctx1: RetryContext = {
      previousRetryCount: 1,
      retryReason: new Error('test'),
      elapsedMilliseconds: 2000,
    };
    const ctx2: RetryContext = {
      previousRetryCount: 2,
      retryReason: new Error('test'),
      elapsedMilliseconds: 7000,
    };
    const ctx3: RetryContext = {
      previousRetryCount: 3,
      retryReason: new Error('test'),
      elapsedMilliseconds: 17000,
    };
    const ctx4: RetryContext = {
      previousRetryCount: 4,
      retryReason: new Error('test'),
      elapsedMilliseconds: 47000,
    };
    const ctx100: RetryContext = {
      previousRetryCount: 100,
      retryReason: new Error('test'),
      elapsedMilliseconds: 100000,
    };

    expect(policy.nextRetryDelayInMilliseconds(ctx0)).toBe(0);
    expect(policy.nextRetryDelayInMilliseconds(ctx1)).toBe(2000);
    expect(policy.nextRetryDelayInMilliseconds(ctx2)).toBe(5000);
    expect(policy.nextRetryDelayInMilliseconds(ctx3)).toBe(10000);
    expect(policy.nextRetryDelayInMilliseconds(ctx4)).toBe(30000);
    expect(policy.nextRetryDelayInMilliseconds(ctx100)).toBe(30000);
  });

  it('createOperationalRetryPolicy should return an active instance', () => {
    const policy = createOperationalRetryPolicy();
    expect(policy).toBeDefined();
    expect(
      policy.nextRetryDelayInMilliseconds({
        previousRetryCount: 0,
        retryReason: new Error(),
        elapsedMilliseconds: 0,
      }),
    ).toBe(0);
  });
});
