# Webflow CMS Structure Documentation

## Overview

Your Webflow CMS uses a **hub-and-spoke architecture** with **Profiles** as the central collection. All other content types (Blogs, Videos, Services, Reviews, etc.) reference a Profile.

```
        Categories
            ↓
        Profiles (HUB)
            ↑
    ┌───┬───┼───┬───┬───┬───┬───┐
    │   │   │   │   │   │   │   │
  Blogs Videos Services Reviews Locations FAQs Scenarios ServicesRef
```

---

## Collection Details

### 1. 🏢 PROFILES (Main Hub)
**Collection ID:** `6919a7f067ba553645e406a6`
**URL Pattern:** `/profile/[slug]`
**Purpose:** Business/company profiles - the central entity

#### Required Fields:
- `name` (PlainText) - Business_profile ⭐
- `slug` (PlainText) - Unique identifier ⭐

#### Profile Information:
- `business-name` (PlainText) - Display name
- `social-handle` (PlainText) - @handle
- `short-description` (PlainText) - Tagline
- `ai-summary` (PlainText) - AI-generated summary
- `about-description` (PlainText) - Full description
- `about-tag1-4` (PlainText) - Feature highlights

#### Contact Details:
- `email` (Email)
- `call-now-2` (Phone) - Phone number
- `visit-website-2` (Link) - Website URL
- `city` (PlainText)
- `state` (PlainText)

#### Media:
- `profile-image` (Image) - Logo/main image
- `gallery` (MultiImage) - Photo gallery

#### Social Media:
- `facebook-url` (Link)
- `instagram-url` (Link)
- `youtube-url` (Link)

#### Settings:
- `category` (Reference) → Categories collection
- `spotlight` (Switch) - Show in directory
- `directory` (Switch) - Show in spotlight
- `package-type` (Option) - `discover` or `verified`

#### Other:
- `pricing-information` (PlainText)
- `schema-json` (PlainText) - Structured data for SEO

---

### 2. 📝 BLOGS
**Collection ID:** `6924108f80f9c5582bc96d73`
**References:** Profiles
**Purpose:** Blog posts authored by/about a business

#### Fields:
- `name` (PlainText) - Title ⭐
- `slug` (PlainText) ⭐
- `profile` (Reference) → Profiles 🔗
- `body` (RichText) - Blog content
- `cover-image` (Image)
- `publish-date` (DateTime)
- `category-tag` (PlainText)
- `schema-json` (PlainText) - SEO metadata

---

### 3. 🎥 VIDEOS
**Collection ID:** `692411de97b9276613a4ccb7`
**References:** Profiles
**Purpose:** Video content for a business

#### Fields:
- `name` (PlainText) - Title ⭐
- `slug` (PlainText) ⭐
- `profile` (Reference) → Profiles 🔗
- `platform` (Option) - `Youtube` or `Tiktok`
- `video-url` (Link)
- `thumbnail-image` (Image)
- `publish-date` (DateTime)

---

### 4. 🛠️ SERVICES
**Collection ID:** `691b7c75c939d316cb7f73b0`
**References:** Profiles
**Purpose:** Specific services offered by a business

#### Fields:
- `name` (PlainText) - Service name ⭐
- `slug` (PlainText) ⭐
- `profile` (Reference) → Profiles 🔗
- `description` (PlainText)
- `price-estimate` (PlainText) - Starting price
- `duration` (PlainText)
- `included1-4` (PlainText) - What's included (up to 4 items)

---

### 5. 🔖 SERVICES REFERENCES
**Collection ID:** `69258b73b4aa5928c4949176`
**References:** Profiles
**Purpose:** Generic service categories/templates

#### Fields:
- `name` (PlainText) - Service type ⭐
- `slug` (PlainText) ⭐
- `profile` (Reference) → Profiles 🔗
- `duration` (PlainText)
- `complexity` (PlainText)
- `best-for` (PlainText)
- `price-range` (PlainText)

---

### 6. 🎯 SCENARIOS
**Collection ID:** `692591ebc2715ac9182e11d6`
**References:** Profiles
**Purpose:** Use cases / customer scenarios

#### Fields:
- `name` (PlainText) - Scenario name ⭐
- `slug` (PlainText) ⭐
- `profile` (Reference) → Profiles 🔗
- `recommended` (PlainText)
- `pro-tip` (PlainText)
- `whats-involved1-4` (PlainText) - Steps involved

---

### 7. 📍 LOCATIONS
**Collection ID:** `6925a0fc2f4eac43ffd125f6`
**References:** Profiles
**Purpose:** Physical locations/branches

#### Fields:
- `name` (PlainText) ⭐
- `slug` (PlainText) ⭐
- `profile` (Reference) → Profiles 🔗
- `street-address` (PlainText)
- `city` (PlainText)
- `state` (PlainText)
- `postal-code` (PlainText)
- `get-directions` (Link)
- `hours-monday` through `hours-sunday` (PlainText) - Operating hours
- `service-area` (PlainText)

---

### 8. ⭐ REVIEWS
**Collection ID:** `6917304967a914982fd205bc`
**References:** Profiles
**Purpose:** Customer reviews/testimonials

#### Fields:
- `name` (PlainText) - Customer name ⭐
- `slug` (PlainText) ⭐
- `profile` (Reference) → Profiles 🔗
- `review-text` (PlainText)
- `review-avatar` (Image)
- `review-source-company` (PlainText) - Source (Google, Yelp, etc.)
- `review-title` (PlainText)
- `review-date` (DateTime)

---

### 9. 📂 CATEGORIES
**Collection ID:** `6919a0588e5306c0feb97046`
**Purpose:** Business categories/industries

#### Fields:
- `name` (PlainText) ⭐
- `slug` (PlainText) ⭐

**Note:** Profiles reference this collection via the `category` field

---

### 10. ❓ FAQS
**Collection ID:** `692411f2a535a2edbb68ecea`
**References:** Profiles
**Purpose:** Frequently asked questions

#### Fields:
- `name` (PlainText) - Question ⭐
- `slug` (PlainText) ⭐
- `profile` (Reference) → Profiles 🔗
- `answer` (RichText)
- `publish-date` (DateTime)

---

## Current Sync Status

### ✅ Currently Synced:

#### Profiles:
- ✅ Basic info (name, business-name, social-handle)
- ✅ Contact (email, phone, website, city, state)
- ✅ Descriptions (short-description, about-description, ai-summary)
- ✅ Social media (facebook-url, instagram-url, youtube-url)
- ✅ Images (profile-image)
- ✅ Settings (spotlight, directory, package-type)
- ✅ Schema JSON (google maps, yelp, address, zip)

#### Blogs:
- ✅ Title, slug, body (content)
- ✅ Profile reference
- ✅ Cover image, publish date, category tag
- ✅ Schema JSON (SEO metadata)

### ⚠️ NOT Currently Synced:

#### Profiles:
- ❌ `gallery` (MultiImage) - Photo gallery
- ❌ `category` (Reference) - Link to Categories
- ❌ `about-tag1-4` - Feature highlights
- ❌ `pricing-information`

#### Other Collections:
- ❌ **Videos** - Need to create sync endpoint
- ❌ **Services** - Need to create sync endpoint
- ❌ **Services References** - Need to create sync endpoint
- ❌ **Scenarios** - Need to create sync endpoint
- ❌ **Locations** - Need to create sync endpoint
- ❌ **Reviews** - Need to create sync endpoint
- ❌ **FAQs** - Need to create sync endpoint

---

## Recommended Sync Strategy

### Phase 1: Core Profile Data (✅ COMPLETE)
- Profiles (basic info, contact, social media, images)
- Blogs with profile references

### Phase 2: Reviews & Social Proof
1. **Reviews** - Customer testimonials
   - Map from your reviews database
   - Link to profile via reference field

### Phase 3: Service Information
1. **Services** - Specific services offered
2. **Scenarios** - Use cases
3. **Locations** - Physical locations (if multi-location business)

### Phase 4: Additional Content
1. **Videos** - Video content
2. **FAQs** - Common questions
3. **Services References** - Service templates

---

## Field Mapping Reference

### CRM → Webflow Profiles Mapping:

| CRM Field | Webflow Field | Type | Status |
|-----------|---------------|------|--------|
| `name` | `name`, `business-name` | PlainText | ✅ |
| `tagline` / `about` | `short-description`, `about-description` | PlainText | ✅ |
| `ai_summary` | `ai-summary` | PlainText | ✅ |
| `website` | `visit-website-2` | Link | ✅ |
| `phone` | `call-now-2` | Phone | ✅ |
| `email` | `email` | Email | ✅ |
| `city` | `city` | PlainText | ✅ |
| `state` | `state` | PlainText | ✅ |
| `logo_url` | `profile-image` | Image | ✅ |
| `facebook_url` | `facebook-url` | Link | ✅ |
| `instagram_url` | `instagram-url` | Link | ✅ |
| `youtube_url` | `youtube-url` | Link | ✅ |
| `status` | `spotlight` | Switch | ✅ |
| `plan` | `package-type` | Option | ✅ |
| `google_maps_url`, `yelp_url`, `address`, `zip` | `schema-json` | PlainText | ✅ |
| - | `gallery` | MultiImage | ❌ Need images |
| - | `category` | Reference | ❌ Need category mapping |
| - | `about-tag1-4` | PlainText | ❌ Need tags |
| - | `pricing-information` | PlainText | ❌ Need pricing data |

---

## Next Steps to Complete Sync

### 1. Add Missing Profile Fields

If you want to use all Webflow fields, add to your CRM:

```sql
ALTER TABLE companies
ADD COLUMN instagram_url TEXT,
ADD COLUMN youtube_url TEXT,
ADD COLUMN pricing_info TEXT,
ADD COLUMN tag1 TEXT,
ADD COLUMN tag2 TEXT,
ADD COLUMN tag3 TEXT,
ADD COLUMN tag4 TEXT,
ADD COLUMN category_id UUID REFERENCES categories(id);
```

### 2. Create Additional Sync Endpoints

Based on your CRM data, create sync endpoints for:
- `/api/webflow/sync-reviews` - If you have reviews data
- `/api/webflow/sync-videos` - If you have video links
- `/api/webflow/sync-services` - If you track services per company
- `/api/webflow/sync-locations` - If you have multi-location businesses
- `/api/webflow/sync-faqs` - If you have FAQ data

### 3. Category Management

Create a category sync or manually populate the Categories collection, then update profiles to reference them.

---

## Testing Your Sync

### Current Working Syncs:

1. **Bulk Profiles Sync:**
   ```
   Settings → Webflow CMS Sync → "Sync Profiles Now"
   ```

2. **Single Company Publish:**
   ```
   Companies → [Company] → "Sync to Webflow"
   ```

3. **Bulk Blogs Sync:**
   ```
   Settings → Webflow CMS Sync → "Sync Content Now"
   ```

### Preview URLs:
- **Staging:** `http://eyesai.webflow.io/profile/[slug]`
- **Production:** `https://eyesai.ai/profile/[slug]` (when you go live)

---

## Collection IDs Quick Reference

```javascript
const COLLECTION_IDS = {
  PROFILES: '6919a7f067ba553645e406a6',
  BLOGS: '6924108f80f9c5582bc96d73',
  VIDEOS: '692411de97b9276613a4ccb7',
  SERVICES: '691b7c75c939d316cb7f73b0',
  SERVICES_REFERENCES: '69258b73b4aa5928c4949176',
  SCENARIOS: '692591ebc2715ac9182e11d6',
  LOCATIONS: '6925a0fc2f4eac43ffd125f6',
  REVIEWS: '6917304967a914982fd205bc',
  CATEGORIES: '6919a0588e5306c0feb97046',
  FAQS: '692411f2a535a2edbb68ecea',
};
```

---

## API Endpoints

### Environment Variables Required:
```env
WEBFLOW_SITE_ID=68db778020fc2ac5c78f401a
WEBFLOW_CMS_SITE_API_TOKEN=your_token
WEBFLOW_PREVIEW_DOMAIN=http://eyesai.webflow.io
NEXT_PUBLIC_WEBFLOW_DOMAIN=http://eyesai.webflow.io
```

### Current Sync Endpoints:
1. `POST /api/webflow/sync-profiles` - Bulk sync all companies
2. `POST /api/webflow/sync-content` - Bulk sync all published blogs
3. `POST /api/webflow/publish-company` - Sync single company

---

Generated: 2025-11-26
Last Updated: Auto-generated from Webflow API
