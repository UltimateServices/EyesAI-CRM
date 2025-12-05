# Webflow to Stripe Subscription Integration

This document explains how the Webflow onboarding form integrates with the EyesAI CRM and Stripe for subscription signups.

## Two Integration Options

### Option A: Native Webflow Webhook (Recommended)
Uses Webflow's built-in form webhook. After submission, user receives checkout link via email.

### Option B: Custom JavaScript
Uses custom JavaScript to submit form and redirect immediately to Stripe checkout.

---

## Option A: Native Webflow Webhook Flow (Check Your Email)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WEBFLOW ONBOARDING FORM                          │
│                 https://eyesai.webflow.io/onboarding                │
├─────────────────────────────────────────────────────────────────────┤
│ Step 1: Business Type (Business / Freelancer)                       │
│ Step 2: URL + Company Name + Email                                  │
│ Step 3: Plan Selection (Discover $39 / Verified $69)               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Native Webflow Form Submit
                              │ (Configure webhook in Site Settings → Forms)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│              WEBFLOW FORM WEBHOOK                                    │
│   POST https://eyes-ai-crm.vercel.app/api/webflow/form-webhook      │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Receive form data                                                │
│ 2. Create company record (status: PENDING)                          │
│ 3. Create Stripe checkout session (24hr expiry)                    │
│ 4. Send checkout link email via Klaviyo                            │
│ 5. Return success (Webflow redirects to success action)            │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Webflow redirects to configured success page
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   CHECK YOUR EMAIL PAGE (Webflow)                   │
│          https://eyesai.webflow.io/check-email                     │
├─────────────────────────────────────────────────────────────────────┤
│ "Check your inbox! We've sent your payment link."                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ User clicks link in email
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      STRIPE CHECKOUT                                │
│              checkout.stripe.com/...                                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              (Same webhook flow as Option B below)
```

### Webflow Setup for Option A:
1. Go to **Site Settings → Forms → Add Webhook**
2. URL: `https://eyes-ai-crm.vercel.app/api/webflow/form-webhook`
3. Set form redirect to `/check-email` page
4. Create a "Check Your Email" page in Webflow

### Klaviyo Setup for Option A:
1. Create a new Flow triggered by **"Checkout Link Requested"** event
2. Add an email action with template containing `{{ event.checkout_url }}`
3. Available variables:
   - `{{ event.company_name }}`
   - `{{ event.checkout_url }}`
   - `{{ event.plan_name }}`
   - `{{ event.plan_price }}`
   - `{{ event.expires_in }}`

---

## Option B: Custom JavaScript Flow (Immediate Redirect)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WEBFLOW ONBOARDING FORM                          │
│                 https://eyesai.webflow.io/onboarding                │
├─────────────────────────────────────────────────────────────────────┤
│ Step 1: Business Type (Business / Freelancer)                       │
│ Step 2: URL + Company Name                                          │
│ Step 3: Plan Selection (Discover $39 / Verified $69)               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Form Submit (JavaScript fetch)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│              CRM API ENDPOINT                                        │
│   POST https://eyes-ai-crm.vercel.app/api/webflow/onboarding-submission │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Receive form data                                                │
│ 2. Create company record (status: PENDING)                          │
│ 3. Create Stripe checkout session                                   │
│ 4. Return checkout URL                                              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ JavaScript redirects to checkoutUrl
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      STRIPE CHECKOUT                                │
│              checkout.stripe.com/...                                │
├─────────────────────────────────────────────────────────────────────┤
│ - Customer enters payment info                                      │
│ - Completes subscription                                            │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Webhook: checkout.session.completed
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   STRIPE WEBHOOK HANDLER                            │
│   POST https://eyes-ai-crm.vercel.app/api/webhooks/stripe          │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Update company status to NEW                                     │
│ 2. Store stripe_customer_id, stripe_subscription_id                 │
│ 3. Initialize onboarding steps                                      │
│ 4. Mark Step 1 (Stripe Signup) as complete                         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Redirect (success_url)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   SUCCESS PAGE (Webflow)                            │
│          https://eyesai.webflow.io/succes                          │
├─────────────────────────────────────────────────────────────────────┤
│ - Show confirmation                                                 │
│ - Provide next steps                                                │
│ - Link to client portal                                             │
│ - Query params: ?session_id=xxx&company_id=xxx                     │
└─────────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### 1. Webflow Form Submission

**Endpoint:** `POST /api/webflow/onboarding-submission`

**Request:**
```json
{
  "company-name": "Acme Corp",
  "website-url": "https://acme.com",
  "email": "contact@acme.com",
  "phone": "555-1234",
  "plan": "discover",
  "business-type": "business"
}
```

**Response:**
```json
{
  "success": true,
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_xxx",
  "sessionId": "cs_test_xxx",
  "companyId": "uuid-xxx",
  "plan": "DISCOVER"
}
```

### 2. Stripe Checkout Session Creation

**Endpoint:** `POST /api/stripe/create-checkout`

**Request:**
```json
{
  "plan": "discover",
  "companyId": "optional-existing-company-id",
  "companyName": "Acme Corp",
  "email": "contact@acme.com",
  "successUrl": "https://example.com/success",
  "cancelUrl": "https://example.com/cancel"
}
```

**Response:**
```json
{
  "success": true,
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_xxx",
  "sessionId": "cs_test_xxx"
}
```

### 3. Get Available Plans

**Endpoint:** `GET /api/stripe/create-checkout`

**Response:**
```json
{
  "plans": [
    {
      "id": "discover",
      "name": "Discover",
      "price": 39,
      "priceId": "price_xxx",
      "productId": "prod_xxx",
      "features": ["..."]
    },
    {
      "id": "verified",
      "name": "Verified",
      "price": 69,
      "priceId": "price_xxx",
      "productId": "prod_xxx",
      "features": ["..."]
    }
  ],
  "currency": "USD",
  "interval": "month"
}
```

## Webflow Integration Code

Add this JavaScript to your Webflow onboarding form:

```javascript
// On final step form submission
document.querySelector('#onboarding-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Get form data
  const formData = {
    'business-type': document.querySelector('[name="business-type"]:checked').value,
    'website-url': document.querySelector('[name="website-url"]').value,
    'company-name': document.querySelector('[name="company-name"]').value,
    'email': document.querySelector('[name="email"]')?.value || '',
    'plan': document.querySelector('[name="plan"]:checked').value,
  };

  // Show loading state
  const submitBtn = document.querySelector('#submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Processing...';

  try {
    // Submit to CRM API
    const response = await fetch('https://eyes-ai-crm.vercel.app/api/webflow/onboarding-submission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (data.success && data.checkoutUrl) {
      // Redirect to Stripe checkout
      window.location.href = data.checkoutUrl;
    } else {
      throw new Error(data.error || 'Failed to process');
    }
  } catch (error) {
    console.error('Submission error:', error);
    alert('Something went wrong. Please try again.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Continue to Payment';
  }
});
```

## Stripe Webhook Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Update company with Stripe IDs, mark Step 1 complete |
| `customer.subscription.created` | Update subscription details |
| `customer.subscription.updated` | Update subscription status and period |
| `customer.subscription.deleted` | Mark company as CHURNED |
| `invoice.payment_succeeded` | Update payment status |
| `invoice.payment_failed` | Mark subscription as past_due |

## Database Fields Updated

When checkout completes, the following fields are updated on the company record:

```sql
-- Updated by webhook
stripe_customer_id = 'cus_xxx'
stripe_subscription_id = 'sub_xxx'
status = 'NEW'  -- Changed from 'PENDING'
subscription_status = 'active'
subscription_current_period_start = timestamp
subscription_current_period_end = timestamp
stripe_checkout_completed_at = timestamp
```

## Environment Variables Required

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Product IDs
STRIPE_BASIC_PRODUCT_ID=prod_T1WwzkEYNLMu7U
STRIPE_BASIC_PRICE_ID=price_1S5TsBR3YaBGSYsUw7ZN9w6s
STRIPE_VERIFIED_PRODUCT_ID=prod_T1Wx1GTboL2svY
STRIPE_VERIFIED_PRICE_ID=price_1S5TtFR3YaBGSYsUeJciyfls

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=https://eyes-ai-crm.vercel.app
```

## Testing the Integration

### 1. Test with Stripe CLI (Local)

```bash
# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test event
stripe trigger checkout.session.completed
```

### 2. Test API Endpoint

```bash
# Test form submission
curl -X POST https://eyes-ai-crm.vercel.app/api/webflow/onboarding-submission \
  -H "Content-Type: application/json" \
  -d '{
    "company-name": "Test Company",
    "website-url": "https://test.com",
    "email": "test@example.com",
    "plan": "discover",
    "business-type": "business"
  }'
```

### 3. Test Checkout Link

Use the `checkoutUrl` returned from the API to complete a test checkout with Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

## Troubleshooting

### Form Not Submitting
- Check browser console for JavaScript errors
- Verify CORS is enabled on the API endpoint
- Check network tab for request/response

### Checkout URL Not Working
- Verify Stripe price IDs are correct
- Check Stripe dashboard for error logs
- Ensure products are active in Stripe

### Webhook Not Firing
- Verify webhook URL in Stripe dashboard
- Check webhook signing secret matches
- Review Stripe webhook logs for delivery status

### Company Not Created
- Check Supabase logs for errors
- Verify organization exists in database
- Check service role key permissions
