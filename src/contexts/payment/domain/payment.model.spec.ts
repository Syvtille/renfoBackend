import { PaymentModel } from './payment.model';
import { PaymentStatus } from './enums/payment-status.enum';

describe('PaymentModel', () => {
  const makePayment = () =>
    new PaymentModel('p1', 'u1', 'prod1', 999, 'eur', PaymentStatus.PENDING, 'pi_x', null, new Date());

  it('markSucceeded change le status à SUCCEEDED', () => {
    const p = makePayment();
    p.markSucceeded();
    expect(p.status).toBe(PaymentStatus.SUCCEEDED);
  });

  it('markFailed change le status à FAILED', () => {
    const p = makePayment();
    p.markFailed();
    expect(p.status).toBe(PaymentStatus.FAILED);
  });

  it('isCompleted retourne true seulement si SUCCEEDED', () => {
    const p = makePayment();
    expect(p.isCompleted()).toBe(false);
    p.markSucceeded();
    expect(p.isCompleted()).toBe(true);
  });
});
