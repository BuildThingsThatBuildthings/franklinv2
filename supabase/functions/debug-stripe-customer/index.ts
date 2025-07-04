import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

// Helper function to create responses with CORS headers
function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const { customer_id } = await req.json();

    if (!customer_id) {
      return corsResponse({ error: 'customer_id is required' }, 400);
    }

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser(token);

    if (getUserError || !user) {
      return corsResponse({ error: 'Failed to authenticate user' }, 401);
    }

    // Verify that this customer belongs to the authenticated user
    const { data: customer, error: getCustomerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .eq('customer_id', customer_id)
      .is('deleted_at', null)
      .maybeSingle();

    if (getCustomerError || !customer) {
      return corsResponse({ error: 'Customer not found or access denied' }, 404);
    }

    // Fetch customer details from Stripe
    const stripeCustomer = await stripe.customers.retrieve(customer_id);
    
    // Fetch all subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer_id,
      limit: 10,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    // Fetch all invoices for this customer
    const invoices = await stripe.invoices.list({
      customer: customer_id,
      limit: 5,
    });

    // Fetch payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer_id,
      limit: 5,
    });

    return corsResponse({
      customer: stripeCustomer,
      subscriptions: subscriptions.data,
      invoices: invoices.data,
      paymentMethods: paymentMethods.data,
      analysis: {
        hasActiveSubscription: subscriptions.data.some(sub => ['active', 'trialing'].includes(sub.status)),
        isPromoCustomer: stripeCustomer.metadata?.promo === 'true' || 
                        subscriptions.data.some(sub => sub.discount?.coupon?.percent_off === 100),
        isBetaCustomer: stripeCustomer.metadata?.beta === 'true' ||
                       stripeCustomer.email?.includes('beta') ||
                       subscriptions.data.some(sub => sub.metadata?.type === 'beta'),
      }
    });

  } catch (error: any) {
    console.error(`Debug error: ${error.message}`);
    return corsResponse({ error: error.message }, 500);
  }
});