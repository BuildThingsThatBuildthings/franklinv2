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

    // Fetch the latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customer_id,
      limit: 5, // Get more subscriptions to find the best one
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    console.log(`Found ${subscriptions.data.length} subscriptions for customer ${customer_id}`);

    if (subscriptions.data.length === 0) {
      // No subscriptions found, update status to not_started
      const { error: updateError } = await supabase.from('stripe_subscriptions').upsert(
        {
          customer_id: customer_id,
          subscription_id: null,
          price_id: null,
          current_period_start: null,
          current_period_end: null,
          cancel_at_period_end: false,
          payment_method_brand: null,
          payment_method_last4: null,
          status: 'not_started',
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'customer_id',
        },
      );

      if (updateError) {
        console.error('Error updating subscription status:', updateError);
        return corsResponse({ error: 'Failed to update subscription status' }, 500);
      }

      return corsResponse({ 
        success: true, 
        message: 'No active subscriptions found',
        status: 'not_started'
      });
    }

    // Find the most relevant subscription (prioritize active, then trialing, then others)
    const priorityOrder = ['active', 'trialing', 'past_due', 'incomplete', 'canceled', 'unpaid'];
    let subscription = subscriptions.data[0];
    
    for (const status of priorityOrder) {
      const foundSub = subscriptions.data.find(sub => sub.status === status);
      if (foundSub) {
        subscription = foundSub;
        break;
      }
    }

    console.log(`Syncing subscription ${subscription.id} with status ${subscription.status} (selected from ${subscriptions.data.length} total subscriptions)`);

    // Update the local database with the latest subscription data
    const updateData: any = {
      customer_id: customer_id,
      subscription_id: subscription.id,
      price_id: subscription.items.data[0].price.id,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      status: subscription.status,
      updated_at: new Date().toISOString(),
    };

    // Add payment method info if available
    if (subscription.default_payment_method && typeof subscription.default_payment_method !== 'string') {
      updateData.payment_method_brand = subscription.default_payment_method.card?.brand ?? null;
      updateData.payment_method_last4 = subscription.default_payment_method.card?.last4 ?? null;
    }

    const { error: updateError } = await supabase.from('stripe_subscriptions').upsert(
      updateData,
      {
        onConflict: 'customer_id',
      },
    );

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return corsResponse({ error: 'Failed to update subscription' }, 500);
    }

    console.log(`Successfully synced subscription ${subscription.id} with status ${subscription.status}`);

    return corsResponse({ 
      success: true, 
      message: 'Subscription synced successfully',
      status: subscription.status,
      subscription_id: subscription.id
    });

  } catch (error: any) {
    console.error(`Sync error: ${error.message}`);
    return corsResponse({ error: error.message }, 500);
  }
});