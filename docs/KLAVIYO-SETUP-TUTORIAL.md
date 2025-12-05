# EyesAI Klaviyo Email Setup Tutorial

This guide shows you how to set up automated emails in Klaviyo for the EyesAI onboarding flow.

---

## Overview

You need to create **2 email flows** in Klaviyo:

| Email | When It Sends | Purpose |
|-------|---------------|---------|
| **Checkout Link** | After form submission | Sends Stripe payment link |
| **Profile is Live** | After profile published | Notifies customer their profile is live |

---

## Prerequisites

- Klaviyo account (free tier works)
- Access to your Klaviyo dashboard: https://www.klaviyo.com

---

## Flow 1: Checkout Link Email

This email sends when a customer submits the onboarding form on your website.

### Step 1: Create New Flow

1. Log in to Klaviyo
2. Click **Flows** in the left sidebar
3. Click **Create Flow** button (top right)
4. Select **Create from Scratch**
5. Name it: `Checkout Link Requested`
6. Click **Create Flow**

### Step 2: Set Up the Trigger

1. Click on the **Trigger** box
2. Select **Metric** as the trigger type
3. In the dropdown, search for: `Checkout Link Requested`
   - If you don't see it, your system hasn't sent a test event yet
   - Run this command to create it: `node test-klaviyo-emails.js checkout your@email.com`
4. Click **Done**

### Step 3: Add Email Action

1. Click the **+** button below the trigger
2. Select **Email**
3. Click **Configure Content**

### Step 4: Design Your Email

**Subject Line:**
```
Complete Your EyesAI Subscription - {{ event.company_name }}
```

**Email Body Example:**

```html
Hi there,

Thanks for signing up {{ event.company_name }} for EyesAI!

To complete your {{ event.plan_name }} subscription, click the button below:

[BUTTON: Complete Payment - {{ event.plan_price }}/month]
Link: {{ event.checkout_url }}

This link expires in {{ event.expires_in }}.

Questions? Reply to this email.

Best,
The EyesAI Team
```

### Step 5: Add the Payment Button

1. Drag a **Button** block into your email
2. Set the button text: `Complete Payment - {{ event.plan_price }}/month`
3. Set the button URL: `{{ event.checkout_url }}`
4. Style as desired

### Step 6: Available Variables

Use these in your email template:

| Variable | What It Shows | Example |
|----------|---------------|---------|
| `{{ event.company_name }}` | Company name | Acme Corp |
| `{{ event.checkout_url }}` | Stripe payment link | https://checkout.stripe.com/... |
| `{{ event.plan_name }}` | Plan name | DISCOVER |
| `{{ event.plan_price }}` | Monthly price | $39 |
| `{{ event.expires_in }}` | Link expiration | 24 hours |

### Step 7: Activate the Flow

1. Click **Review and Turn On** (top right)
2. Review settings
3. Click **Turn On**

---

## Flow 2: Profile is Live Email

This email sends when your team publishes a customer's profile to the website.

### Step 1: Create New Flow

1. Click **Flows** in the left sidebar
2. Click **Create Flow** button
3. Select **Create from Scratch**
4. Name it: `Profile is Live`
5. Click **Create Flow**

### Step 2: Set Up the Trigger

1. Click on the **Trigger** box
2. Select **Metric** as the trigger type
3. Search for: `Profile is Live`
4. Click **Done**

### Step 3: Add Email Action

1. Click the **+** button below the trigger
2. Select **Email**
3. Click **Configure Content**

### Step 4: Design Your Email

**Subject Line:**
```
🎉 {{ event.company_name }} is Now Live on EyesAI!
```

**Email Body Example:**

```html
Hi there,

Great news! Your business profile for {{ event.company_name }} is now live!

Your profile is optimized and discoverable on AI platforms like ChatGPT, Claude, and Google AI.

[BUTTON: View Your Live Profile]
Link: {{ event.profile_url }}

What happens next:
• Your profile is now searchable on AI platforms
• Customers can discover you through AI assistants
• You'll receive monthly performance reports

Share your profile on social media to boost visibility!

Questions? Reply to this email.

Welcome to AI-powered discovery!

The EyesAI Team
```

### Step 5: Add the Profile Button

1. Drag a **Button** block into your email
2. Set the button text: `View Your Live Profile →`
3. Set the button URL: `{{ event.profile_url }}`
4. Style as desired

### Step 6: Available Variables

| Variable | What It Shows | Example |
|----------|---------------|---------|
| `{{ event.company_name }}` | Company name | Acme Corp |
| `{{ event.profile_url }}` | Live profile link | https://eyesai.ai/profile/acme-corp |
| `{{ event.package_type }}` | Package type | DISCOVER or VERIFIED |

### Step 7: Activate the Flow

1. Click **Review and Turn On**
2. Review settings
3. Click **Turn On**

---

## Testing Your Flows

### Option 1: Use Test Script

Run these commands from the EyesAI project folder:

```bash
# Test checkout email
node test-klaviyo-emails.js checkout your@email.com

# Test profile live email
node test-klaviyo-emails.js profile-live your@email.com

# Test both
node test-klaviyo-emails.js all your@email.com
```

### Option 2: Check Klaviyo Analytics

1. Go to **Analytics** → **Metrics**
2. Find your metric (Checkout Link Requested or Profile is Live)
3. Click to see recent events
4. Verify data is being received

---

## Troubleshooting

### "Metric not found" when setting up trigger

**Cause:** No events have been sent to Klaviyo yet.

**Solution:** Run the test script:
```bash
node test-klaviyo-emails.js all your@email.com
```

### Emails not sending

**Check:**
1. Is the Flow turned ON? (not Draft)
2. Is the trigger metric spelled exactly right?
3. Is your email not in Klaviyo's suppression list?

### Variables showing as blank

**Check:**
1. Make sure you're using `{{ event.variable_name }}` format
2. Variable names are case-sensitive
3. Check the event in Klaviyo Analytics to see actual property names

### Link not clickable in email

**Check:**
1. Make sure the button URL field contains `{{ event.checkout_url }}` or `{{ event.profile_url }}`
2. Don't add extra text around the variable in the URL field

---

## Email Design Tips

### Checkout Email Best Practices
- Use urgent language ("expires in 24 hours")
- Make the payment button prominent
- Keep it short - they've already decided to sign up
- Include the price clearly

### Profile Live Email Best Practices
- Celebrate their milestone
- Include a clear CTA to view their profile
- Suggest sharing on social media
- Set expectations for what comes next

---

## Quick Reference

### Checkout Link Email
- **Flow Name:** Checkout Link Requested
- **Trigger Metric:** Checkout Link Requested
- **Key Variable:** `{{ event.checkout_url }}`

### Profile Live Email
- **Flow Name:** Profile is Live
- **Trigger Metric:** Profile is Live
- **Key Variable:** `{{ event.profile_url }}`

---

## Support

If you have issues:
1. Check the Troubleshooting section above
2. Verify events in Klaviyo Analytics → Metrics
3. Contact EyesAI support

---

## Summary Checklist

- [ ] Created "Checkout Link Requested" flow
- [ ] Added email with `{{ event.checkout_url }}` button
- [ ] Turned on the checkout flow
- [ ] Created "Profile is Live" flow
- [ ] Added email with `{{ event.profile_url }}` button
- [ ] Turned on the profile live flow
- [ ] Tested both emails with test script
- [ ] Verified emails arrived in inbox
