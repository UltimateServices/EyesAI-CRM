# Klaviyo Email Setup Guide

This guide walks you through setting up email flows in Klaviyo for the EyesAI CRM.

## Overview

The EyesAI CRM triggers two types of emails via Klaviyo:

1. **Checkout Link Requested** - Sent immediately after form submission with payment link
2. **Profile is Live** - Sent after profile is published to Webflow

## Prerequisites

- Klaviyo account (free plan works)
- Klaviyo API key configured in `.env` file
- Access to Klaviyo dashboard: https://www.klaviyo.com

---

## Email 1: Checkout Link Requested

### When it's triggered
- User submits the Webflow onboarding form
- System creates company record and Stripe checkout session
- Email sent with 24-hour payment link

### Setup Steps

1. **Go to Flows** in Klaviyo dashboard
   - Navigate to https://www.klaviyo.com/flows

2. **Create New Flow**
   - Click "Create Flow"
   - Choose "Create From Scratch"
   - Name: "Checkout Link Requested"

3. **Set Trigger**
   - Click on the trigger node
   - Select "Metric"
   - Choose or create metric: **"Checkout Link Requested"**
   - Save

4. **Add Email Action**
   - Click the + button below the trigger
   - Select "Email"
   - Design your email template

5. **Use These Variables in Your Email Template**
   ```
   {{ event.company_name }}        - Company name
   {{ event.checkout_url }}        - Stripe payment link (IMPORTANT!)
   {{ event.plan_name }}          - Plan name (DISCOVER/VERIFIED)
   {{ event.plan_price }}         - Price ($39/$69)
   {{ event.expires_in }}         - Expiration time (24 hours)
   ```

6. **Sample Email Template**
   ```html
   Subject: Complete Your EyesAI Subscription - {{ event.company_name }}

   Hi there,

   Thanks for signing up {{ event.company_name }} for EyesAI!

   To complete your {{ event.plan_name }} subscription ({{ event.plan_price }}/month),
   please click the button below to enter your payment information:

   [Button: Complete Payment] → {{ event.checkout_url }}

   ⏰ This link expires in {{ event.expires_in }}.

   Questions? Reply to this email.

   Best,
   The EyesAI Team
   ```

7. **Activate Flow**
   - Review your flow
   - Click "Review & Turn On"

---

## Email 2: Profile is Live

### When it's triggered
- VA completes Step 5 of onboarding (Publish to Webflow)
- Profile is successfully published and live on eyesai.ai
- Email sent to notify client their profile is discoverable

### Setup Steps

1. **Go to Flows** in Klaviyo dashboard
   - Navigate to https://www.klaviyo.com/flows

2. **Create New Flow**
   - Click "Create Flow"
   - Choose "Create From Scratch"
   - Name: "Profile is Live"

3. **Set Trigger**
   - Click on the trigger node
   - Select "Metric"
   - Choose or create metric: **"Profile is Live"**
   - Save

4. **Add Email Action**
   - Click the + button below the trigger
   - Select "Email"
   - Design your email template

5. **Use These Variables in Your Email Template**
   ```
   {{ event.company_name }}        - Company name
   {{ event.profile_url }}         - Live profile URL (IMPORTANT!)
   {{ event.package_type }}        - Package type (DISCOVER/VERIFIED)
   ```

6. **Sample Email Template**
   ```html
   Subject: 🎉 {{ event.company_name }} is Now Live on EyesAI!

   Hi there,

   Great news! Your business profile for {{ event.company_name }} is now live
   and discoverable on AI platforms like ChatGPT, Claude, and Google AI.

   🔗 View Your Live Profile:
   {{ event.profile_url }}

   What happens next:
   • Your profile is now optimized for AI search
   • Customers can discover you through AI assistants
   • You'll receive monthly performance reports
   • We continuously optimize your visibility

   💡 Share your profile on social media to boost visibility!

   Questions? Reply to this email anytime.

   Welcome to AI-powered discovery!

   The EyesAI Team

   ---
   {{ event.package_type }} Package
   ```

7. **Activate Flow**
   - Review your flow
   - Click "Review & Turn On"

---

## Testing Your Flows

### Option 1: Use Test Script

```bash
# Test both emails
node test-klaviyo-emails.js all your-email@example.com

# Test checkout email only
node test-klaviyo-emails.js checkout your-email@example.com

# Test profile live email only
node test-klaviyo-emails.js profile-live your-email@example.com
```

### Option 2: Manual Test in Klaviyo

1. Go to your Flow
2. Click "Preview"
3. Use the "Send test email" feature
4. Note: Test emails won't have real event data

### Option 3: Trigger Events via API

You can manually trigger events by running the test script, which will:
1. Create a profile in Klaviyo for your test email
2. Trigger the event
3. Send the email via your flow

---

## Verifying Events in Klaviyo

### Check if Events Are Being Received

1. Go to **Analytics** → **Metrics** in Klaviyo
2. Look for:
   - "Checkout Link Requested"
   - "Profile is Live"
3. Click on each metric to see recent events
4. Verify the event properties contain correct data

### Check if Emails Are Being Sent

1. Go to **Flows** in Klaviyo
2. Click on your flow
3. Check the "Analytics" tab
4. Look for:
   - Flow triggers
   - Email sends
   - Opens and clicks

---

## Troubleshooting

### Events Not Showing Up in Klaviyo

**Problem**: No events appear in Klaviyo Metrics

**Solutions**:
1. Verify `KLAVIYO_API_KEY` is correctly set in `.env`
2. Check API key permissions in Klaviyo (needs "Write" access)
3. Run test script and check console output for errors
4. Check Klaviyo API logs: Settings → Account → API Keys → View Logs

### Emails Not Being Sent

**Problem**: Events are triggered but no emails sent

**Solutions**:
1. Verify Flow is "Active" (not Draft)
2. Check Flow trigger matches event name exactly (case-sensitive)
3. Verify email is not in "Suppressed" list in Klaviyo
4. Check Flow Analytics for any errors
5. Make sure email template is complete and published

### Wrong Data in Email

**Problem**: Variables showing as empty or incorrect

**Solutions**:
1. Check event properties in Klaviyo Metrics
2. Verify variable names in template match event properties exactly
3. Use `{{ event.property_name }}` format (not `{{ profile.property_name }}`)
4. Review test script to ensure correct data is being sent

### 24-Hour Delay in Checkout Email

**Problem**: Checkout email arrives late

**Solutions**:
1. Check Flow trigger settings for any delays
2. Remove any "Wait" steps in the Flow
3. Verify Flow is set to send immediately on trigger
4. Check Klaviyo status page for any service issues

---

## API Key Permissions

Your Klaviyo API key needs these permissions:
- ✅ **Events**: Write
- ✅ **Profiles**: Write
- ✅ **Metrics**: Read

To check/update permissions:
1. Go to Klaviyo → Settings → Account → API Keys
2. Find your API key
3. Click "Edit Scopes"
4. Enable required permissions

---

## Next Steps

After setting up both flows:

1. ✅ Run test scripts to verify integration
2. ✅ Check Klaviyo for test events
3. ✅ Verify test emails are received
4. ✅ Customize email templates with your branding
5. ✅ Add unsubscribe links (required by law)
6. ✅ Test on production with real form submission

---

## Support

**Klaviyo Documentation**: https://help.klaviyo.com/
**Klaviyo API Docs**: https://developers.klaviyo.com/

**Common Issues**:
- Events not triggering: Check API key and logs
- Emails not sending: Verify Flow is active
- Wrong data: Check event properties in Klaviyo
