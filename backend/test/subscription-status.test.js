require('module-alias/register');
const SubscriptionService = require('../src/services/administration/subscriptions/subscription.service');
const SubscriptionLifecycleService = require('../src/services/administration/subscriptions/subscription-lifecycle.service');

describe('subscription status selection', () => {
  const monthlyPlan = { code: 'DEMO', billing_cycle: 'monthly' };
  const startDate = '2026-10-23T00:00:00.000Z';

  it('uses the selected trial status and trial duration rather than adding a billing cycle', () => {
    const result = SubscriptionService.calculateSubscriptionDates(
      monthlyPlan,
      startDate,
      30,
      null,
      null,
      'trial'
    );

    expect(result.schoolStatus).toBe('trial');
    expect(result.endDate.getTime() - result.startDate.getTime()).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it('uses the selected active status and plan cycle without adding trial days', () => {
    const result = SubscriptionService.calculateSubscriptionDates(
      monthlyPlan,
      startDate,
      30,
      null,
      null,
      'active'
    );

    expect(result.schoolStatus).toBe('active');
    expect(result.endDate.toISOString()).toBe('2026-11-23T00:00:00.000Z');
  });

  it.each(['suspended', 'expired'])('preserves explicitly selected %s status for lifetime plans', status => {
    const result = SubscriptionService.calculateSubscriptionDates(
      { code: 'LIFETIME', billing_cycle: 'lifetime' },
      startDate,
      30,
      null,
      null,
      status
    );
    expect(result.schoolStatus).toBe(status);
  });

  it('rejects unsupported status values', () => {
    expect(() =>
      SubscriptionService.calculateSubscriptionDates(
        monthlyPlan,
        startDate,
        30,
        null,
        null,
        'enabled'
      )
    ).toThrow('Invalid subscription status');
  });

  it.each(['suspended', 'expired'])('does not grant lifetime-plan access when status is %s', status => {
    expect(
      SubscriptionLifecycleService.calculateSubscriptionStatus({
        subscription_plan: 'LIFETIME',
        status,
        subscription_end_date: null
      })
    ).toBe(status);
  });
});
