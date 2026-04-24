import { ProductModel } from './product.model';

describe('ProductModel', () => {
  it('isAvailable retourne true si actif avec stripeProductId et stripePriceId', () => {
    const product = new ProductModel('p1', 'Pack', 'desc', 999, 'eur', 'prod_x', 'price_x', true, new Date(), null, null, null, false);
    expect(product.isAvailable()).toBe(true);
  });

  it('isAvailable retourne false si inactif', () => {
    const product = new ProductModel('p1', 'Pack', 'desc', 999, 'eur', 'prod_x', 'price_x', false, new Date(), null, null, null, false);
    expect(product.isAvailable()).toBe(false);
  });

  it('isAvailable retourne false si pas de stripeProductId', () => {
    const product = new ProductModel('p1', 'Pack', 'desc', 999, 'eur', null, null, true, new Date(), null, null, null, false);
    expect(product.isAvailable()).toBe(false);
  });
});
