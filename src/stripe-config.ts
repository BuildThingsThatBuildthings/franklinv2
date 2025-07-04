export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: number;
  currency: string;
  interval?: 'month' | 'year';
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_ScRbJ6ZECew9FE',
    priceId: 'price_1RhCiGJteaQNzOZDgzrK6ws0',
    name: 'Franklin',
    description: 'Transform your identity goals into daily actions. Franklin helps you break down 12-week outcomes into daily micro-steps, with morning planning and evening reflection to keep you on track.',
    mode: 'subscription',
    price: 9.99,
    currency: 'usd',
    interval: 'month',
  },
];

export const getProductById = (id: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.id === id);
};

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};