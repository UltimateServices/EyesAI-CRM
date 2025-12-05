# EyesAI Email Flow Summary

## ✅ What Was Completed

### 1. Profile is Live Email Integration
- **File**: `src/app/api/webflow/publish-company/route.ts`
- **Added**: `sendProfileLiveEmail()` function at line 923-1028
- **Trigger**: Automatically sends when VA publishes profile to Webflow (Step 5)
- **Status**: ✅ Implemented

### 2. Test Scripts Created

#### Test Klaviyo Emails
- **File**: `test-klaviyo-emails.js`
- **Purpose**: Test both email triggers (Checkout Link + Profile is Live)
- **Usage**:
  ```bash
  node test-klaviyo-emails.js all roma@deduxer.studio
  node test-klaviyo-emails.js checkout roma@deduxer.studio
  node test-klaviyo-emails.js profile-live roma@deduxer.studio
  ```
- **Status**: ✅ Created and tested

#### Test Onboarding Flow
- **File**: `test-onboarding-flow.js`
- **Purpose**: Simulate complete customer journey from form to profile live
- **Usage**:
  ```bash
  node test-onboarding-flow.js
  ```
- **Status**: ✅ Created

### 3. Documentation Updated

#### WEBFLOW-STRIPE-INTEGRATION.md
- Added "Profile is Live" email documentation
- Added testing instructions
- **Status**: ✅ Updated

#### KLAVIYO-EMAIL-SETUP.md
- Complete step-by-step guide for setting up Klaviyo flows
- Sample email templates
- Troubleshooting guide
- **Status**: ✅ Created

### 4. Test Emails Sent
- **Recipient**: roma@deduxer.studio
- **Events Triggered**:
  - ✅ "Checkout Link Requested" event
  - ✅ "Profile is Live" event
- **Profile Created**: `01KBR9K4W1H2S2NKBEP7845CVG`
- **Status**: ✅ Events sent to Klaviyo

---

## 📧 Email Flow Overview

### Current State

```
┌─────────────────────────────────────────────┐
│  WEBFLOW FORM SUBMISSION                    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Email 1: Checkout Link Requested           │
│  - Stripe payment link                      │
│  - Expires in 24 hours                      │
│  - Klaviyo event triggered                  │
└─────────────────────────────────────────────┘
                    ↓
         [User pays via Stripe]
                    ↓
┌─────────────────────────────────────────────┐
│  STRIPE WEBHOOK                             │
│  - Company status → NEW                     │
│  - Onboarding steps initialized             │
└─────────────────────────────────────────────┘
                    ↓
      [VA completes Steps 2-4]
                    ↓
┌─────────────────────────────────────────────┐
│  STEP 5: PUBLISH TO WEBFLOW                 │
│  - Profile published                        │
│  - Email 2: Profile is Live triggered       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Email 2: Profile is Live                   │
│  - Live profile URL                         │
│  - No login credentials                     │
│  - Klaviyo event triggered                  │
└─────────────────────────────────────────────┘
```

---

## 🎯 Next Steps for You

### 1. Set Up Klaviyo Flows (Required)

The code is ready, but you need to create the email templates in Klaviyo:

#### Flow 1: Checkout Link Requested
1. Go to https://www.klaviyo.com/flows
2. Create flow triggered by "Checkout Link Requested" event
3. Add email with these variables:
   - `{{ event.company_name }}`
   - `{{ event.checkout_url }}` ← **Important!**
   - `{{ event.plan_name }}`
   - `{{ event.plan_price }}`
   - `{{ event.expires_in }}`

#### Flow 2: Profile is Live
1. Go to https://www.klaviyo.com/flows
2. Create flow triggered by "Profile is Live" event
3. Add email with these variables:
   - `{{ event.company_name }}`
   - `{{ event.profile_url }}` ← **Important!**
   - `{{ event.package_type }}`

📖 **Full guide**: See `KLAVIYO-EMAIL-SETUP.md`

### 2. Verify Events in Klaviyo

1. Go to https://www.klaviyo.com
2. Navigate to **Analytics** → **Metrics**
3. Look for these two metrics:
   - "Checkout Link Requested"
   - "Profile is Live"
4. Click on "Profile is Live" to see the test event we just sent
5. You should see:
   - Profile: `01KBR9K4W1H2S2NKBEP7845CVG`
   - Email: `roma@deduxer.studio`
   - Company: `Test Company`
   - Profile URL: `https://eyesai.ai/profile/test-company-abc123`

### 3. Check Your Email

**Important**: The events were triggered successfully, but **you won't receive actual emails** until you create the Flows in Klaviyo. The system is just waiting for you to design the email templates.

Once you create the flows, you can re-run the test:
```bash
node test-klaviyo-emails.js profile-live roma@deduxer.studio
```

---

## 🔧 How to Test the Complete Flow

### Local Development

```bash
# 1. Test email triggers
node test-klaviyo-emails.js all roma@deduxer.studio

# 2. Test full onboarding (requires server running)
node test-onboarding-flow.js
```

### Production Flow

1. **Submit Webflow Form**
   - Go to your Webflow onboarding page
   - Fill out the form
   - Submit

2. **Check Email 1 (Checkout Link)**
   - Should arrive within 1-2 minutes
   - Contains Stripe payment link

3. **Complete Payment**
   - Click link in email
   - Enter test card: `4242 4242 4242 4242`
   - Complete checkout

4. **CRM Dashboard**
   - VA logs in to CRM
   - Completes Steps 2-4 (intake, media, etc.)
   - Step 5: Publishes to Webflow

5. **Check Email 2 (Profile is Live)**
   - Should arrive when profile is published
   - Contains live profile URL

---

## 📊 Event Data Reference

### Checkout Link Requested Event Properties
```javascript
{
  company_name: "Company Name",
  checkout_url: "https://checkout.stripe.com/...",
  plan_name: "DISCOVER" | "VERIFIED",
  plan_price: "$39" | "$69",
  expires_in: "24 hours"
}
```

### Profile is Live Event Properties
```javascript
{
  company_name: "Company Name",
  profile_url: "https://eyesai.ai/profile/company-slug",
  package_type: "DISCOVER" | "VERIFIED"
}
```

---

## 🐛 Troubleshooting

### Events not showing in Klaviyo?
- ✅ Verified: Your API key is working (we just sent events)
- Check: https://www.klaviyo.com/analytics/metrics

### Not receiving emails?
- Most likely: Flows not created yet in Klaviyo
- Solution: Create the flows (see KLAVIYO-EMAIL-SETUP.md)

### Want to test again?
```bash
node test-klaviyo-emails.js profile-live roma@deduxer.studio
```

---

## 📁 Files Changed/Created

### Modified Files
- ✅ `src/app/api/webflow/publish-company/route.ts` (added email trigger)
- ✅ `WEBFLOW-STRIPE-INTEGRATION.md` (updated with new email)
- ✅ `.env` (added KLAVIYO_API_KEY)

### New Files
- ✅ `test-klaviyo-emails.js` (email testing script)
- ✅ `test-onboarding-flow.js` (full flow testing)
- ✅ `KLAVIYO-EMAIL-SETUP.md` (setup guide)
- ✅ `EMAIL-FLOW-SUMMARY.md` (this file)

---

## ✅ Deployment Checklist

Before going live:

- [ ] Create "Checkout Link Requested" flow in Klaviyo
- [ ] Create "Profile is Live" flow in Klaviyo
- [ ] Test both flows with test email
- [ ] Verify emails have correct branding
- [ ] Add unsubscribe links to emails
- [ ] Test complete onboarding flow end-to-end
- [ ] Configure Webflow form webhook URL
- [ ] Set up Stripe webhook in production
- [ ] Update environment variables on production server

---

## 🎉 Summary

**What works right now:**
- ✅ Checkout email trigger (Webflow form → Klaviyo)
- ✅ Profile is Live email trigger (Publish → Klaviyo)
- ✅ API integration with Klaviyo
- ✅ Test scripts ready to use

**What you need to do:**
- 🔲 Create email templates in Klaviyo
- 🔲 Design the two flows
- 🔲 Test and verify emails

**Estimated time to complete:** 30-60 minutes

**Result:** Fully automated email flow from signup to profile live! 🚀
