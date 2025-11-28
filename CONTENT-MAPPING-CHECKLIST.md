# Content Mapping Checklist - Braccolino Pool & Spa

## Current Status
✅ Basic info syncing to Webflow (name, logo, badges)
❌ Detailed content NOT syncing (all fields empty in database)

---

## CONTENT SECTIONS VISIBLE IN CRM UI
(Based on your screenshot of Braccolino detail page)

### Section 1: Overview Tab Content
- [ ] **AI Summary** - Long text paragraph about the business
- [ ] **About Section** - Detailed business description
- [ ] **Feature Tags** - 4 tag badges (e.g., "Expert Installation", "Maintenance Services")
- [ ] **Additional Images** - Gallery of business photos

### Section 2: Contact Information
- [ ] **Phone Number**
- [ ] **Email Address**
- [ ] **Physical Address**
- [ ] **City**
- [ ] **State**
- [ ] **ZIP Code**
- [ ] **Website URL**

### Section 3: Social Media
- [ ] **Facebook URL**
- [ ] **Instagram URL**
- [ ] **YouTube URL**

### Section 4: Additional Details
- [ ] **Tagline/Slogan** - Short catchy phrase
- [ ] **Pricing Information** - General pricing details
- [ ] **Google Maps URL**
- [ ] **Yelp URL**

### Section 5: Media Assets
- [ ] **Logo Image** - Primary business logo
- [ ] **Profile/Cover Image** - Hero image for profile
- [ ] **Gallery Images** - Additional photos

---

## DATABASE FIELDS AVAILABLE
(In the `companies` table)

### Basic Contact Fields (Existing)
- `name` - Business name
- `website` - Website URL
- `phone` - Phone number
- `email` - Email address
- `address` - Street address
- `city` - City
- `state` - State
- `zip` - ZIP code
- `logo_url` - Logo image URL

### Content Fields (Just Added - Currently Empty)
- `tagline` - Short tagline/slogan
- `about` - Full business description
- `ai_summary` - AI-generated summary
- `tag1` - Feature tag 1
- `tag2` - Feature tag 2
- `tag3` - Feature tag 3
- `tag4` - Feature tag 4
- `pricing_info` - General pricing information

### Social Media Fields (Just Added - Currently Empty)
- `facebook_url` - Facebook profile URL
- `instagram_url` - Instagram profile URL
- `youtube_url` - YouTube channel URL

### Other Existing Fields
- `google_maps_url` - Google Maps link
- `yelp_url` - Yelp profile link
- `status` - Account status (ACTIVE, INACTIVE)
- `plan` - Subscription plan (discover, verified, premium)

---

## WEBFLOW CMS FIELDS
(What gets sent to Webflow)

### Required Fields
- `name` - Business name
- `slug` - URL slug

### Profile Info
- `business-name` - Business name
- `social-handle` - Social media handle
- `short-description` - Tagline or brief description

### Contact Info
- `city` - City
- `state` - State
- `visit-website-2` - Website URL
- `call-now-2` - Phone number
- `email` - Email address

### Visibility
- `spotlight` - Featured/spotlight status
- `directory` - Show in directory
- `package-type` - Plan type (discover or verified)

### Content
- `about-description` - Full about text
- `ai-summary` - AI-generated summary
- `about-tag1` - Feature tag 1
- `about-tag2` - Feature tag 2
- `about-tag3` - Feature tag 3
- `about-tag4` - Feature tag 4
- `pricing-information` - Pricing details

### Social Media
- `facebook-url` - Facebook link
- `instagram-url` - Instagram link
- `youtube-url` - YouTube link

### Images
- `profile-image` - Main profile image (logo)

### Structured Data
- `schema-json` - JSON with googleMapsUrl, yelpUrl, address, zip

---

## QUESTIONS FOR YOU

Please tell me where each type of content currently lives in your system:

### 1. AI Summary & About Text
**WHERE IS THIS STORED?**
- [ ] In database columns (`about`, `ai_summary`)
- [ ] In a JSON field (like `romaData` or another field)
- [ ] Generated on-the-fly in the UI
- [ ] Stored somewhere else: _______________

### 2. Feature Tags (4 tags shown in CRM)
**WHERE ARE THESE STORED?**
- [ ] In database columns (`tag1`, `tag2`, `tag3`, `tag4`)
- [ ] In a JSON field
- [ ] Hard-coded in the UI
- [ ] Stored somewhere else: _______________

### 3. Social Media URLs
**WHERE ARE THESE STORED?**
- [ ] In database columns (`facebook_url`, `instagram_url`, `youtube_url`)
- [ ] In a JSON field
- [ ] Entered manually each time
- [ ] Stored somewhere else: _______________

### 4. Additional Images (Gallery)
**WHERE ARE THESE STORED?**
- [ ] In a separate `media` or `images` table
- [ ] In a JSON array field
- [ ] In Supabase storage with references in database
- [ ] Stored somewhere else: _______________

### 5. All Other Contact Info (phone, email, address, etc.)
**WHERE IS THIS STORED?**
- [ ] In database columns (already confirmed we have `website` and `logo_url`)
- [ ] Need to check what else exists: _______________

---

## NEXT STEPS

Once you tell me where the content lives, I will:

1. ✅ **If it's in database columns** → Just need to populate the empty fields
2. 🔄 **If it's in JSON fields** → Create a data migration script to extract and populate the new columns
3. 📝 **If it's in separate tables** → Update the sync API to join and fetch the data
4. 🔨 **If it doesn't exist yet** → Create a form/interface to input the content

Then we'll re-sync Braccolino to Webflow with the full content!
