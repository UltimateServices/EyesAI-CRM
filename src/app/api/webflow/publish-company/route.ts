import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// Webflow API constants
const WEBFLOW_SITE_ID = process.env.WEBFLOW_SITE_ID || '68db778020fc2ac5c78f401a';
const WEBFLOW_PREVIEW_DOMAIN = process.env.WEBFLOW_PREVIEW_DOMAIN || 'https://eyesai.ai';

// Generate a short random hash for slugs to avoid Webflow's slug cache
function generateSlugHash(): string {
  return Math.random().toString(36).substring(2, 8);
}

const COLLECTIONS = {
  PROFILES: '6919a7f067ba553645e406a6',
  SERVICES: '691b7c75c939d316cb7f73b0',
  FAQS: '692411f2a535a2edbb68ecea',
  SCENARIOS: '692591ebc2715ac9182e11d6',
  LOCATIONS: '6925a0fc2f4eac43ffd125f6',
  REVIEWS: '6917304967a914982fd205bc',
  SERVICES_REFERENCES: '69258b73b4aa5928c4949176'
};

// Helper to create clean slugs
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Helper to check if value is placeholder
function isEmpty(value: any): boolean {
  return !value || value === '<>' || value === '' || value === 'null' || value === 'undefined';
}

// POST /api/webflow/publish-company - Full sync based on ACTUAL ROMA structure
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get Webflow token from environment
    const webflowToken = process.env.WEBFLOW_CMS_SITE_API_TOKEN;
    if (!webflowToken) {
      return NextResponse.json(
        { error: 'Webflow API token not configured in environment' },
        { status: 500 }
      );
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const body = await request.json();
    const { companyId } = body;

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    // Fetch the company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .eq('organization_id', membership.organization_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Fetch the intake data with full roma_data
    const { data: intake, error: intakeError } = await supabase
      .from('intakes')
      .select('roma_data')
      .eq('company_id', companyId)
      .single();

    if (intakeError || !intake?.roma_data) {
      return NextResponse.json({ error: 'No intake data found for this company' }, { status: 404 });
    }

    const rd = intake.roma_data; // ACTUAL ROMA structure

    // Use existing webflow_slug if available, otherwise generate new one
    const baseSlug = slugify(rd.slug || rd.hero?.business_name || company.name);
    const slug = company.webflow_slug || baseSlug;

    console.log(`\n🚀 Starting full sync for: ${rd.hero?.business_name || company.name}`);
    console.log(`📦 ROMA sections: ${Object.keys(rd).length}`);

    // ============================================
    // STEP 1: Sync Profile
    // ============================================
    const hero = rd.hero || {};
    const about = rd.about_and_badges || rd.about || {};
    const footer = rd.footer || {};

    // Handle BOTH location formats
    let primaryLocation: any = {};
    let city = '';
    let state = '';

    // NEW format (Zoroco): locations_and_hours.locations[]
    if (rd.locations_and_hours?.locations && Array.isArray(rd.locations_and_hours.locations)) {
      primaryLocation = rd.locations_and_hours.locations[0] || {};
      const cityStateZip = primaryLocation.city_state_zip || '';
      const cityStateMatch = cityStateZip.match(/^(.+),\s*([A-Z]{2})\s+(\d{5})$/);
      city = cityStateMatch?.[1] || '';
      state = cityStateMatch?.[2] || '';
    }
    // OLD format (Major Dumpsters): locations.location_1
    else if (rd.locations?.location_1) {
      primaryLocation = rd.locations.location_1;
      // Parse from address_2: "Oceanside, NY 11572"
      const address2Match = primaryLocation.address_2?.match(/^(.+),\s*([A-Z]{2})\s+(\d{5})$/);
      city = address2Match?.[1] || '';
      state = address2Match?.[2] || '';
    }

    const webflowProfile = {
      fieldData: {
        // Required
        name: hero.business_name || hero.company_name || company.name,
        slug: slug,

        // Basic info
        'business-name': hero.business_name || hero.company_name || company.name,
        'social-handle': `@${slugify(hero.business_name || hero.company_name || company.name)}`,

        // AI Summary: NEW format uses about.ai_summary_120w, OLD format uses hero.ai_summary
        'ai-summary': about.ai_summary_120w || hero.ai_summary || '',

        // Tagline/short description
        'short-description': hero.tagline || '',

        // About description: NEW format uses about.heading, OLD format uses about.about_text
        'about-description': about.heading || about.ai_summary_120w || about.about_text || '',

        // About tags/badges: NEW format uses about.company_badges[], OLD format uses about.about_badge_1-4
        'about-tag1': about.company_badges?.[0] || about.about_badge_1 || '',
        'about-tag2': about.company_badges?.[1] || about.about_badge_2 || '',
        'about-tag3': about.company_badges?.[2] || about.about_badge_3 || '',
        'about-tag4': about.company_badges?.[3] || about.about_badge_4 || '',

        // Pricing: NEW format uses summary_line, OLD format uses pricing_summary
        'pricing-information': rd.pricing_information?.summary_line || rd.pricing_information?.pricing_summary || '',

        // Contact: NEW format uses hero.quick_actions, OLD format uses hero directly
        'call-now-2': hero.quick_actions?.call_tel?.replace('tel:', '') || hero.phone || '',
        'email': hero.quick_actions?.email_mailto?.replace('mailto:', '') || hero.email || '',
        'visit-website-2': hero.quick_actions?.website_url || hero.website_url || footer.website || '',

        // Location
        'city': city,
        'state': state,

        // Social media: NEW format uses footer.social, OLD format uses get_in_touch
        'facebook-url': footer.social?.facebook || rd.get_in_touch?.social_facebook || '',
        'instagram-url': footer.social?.instagram || rd.get_in_touch?.social_instagram || '',
        'youtube-url': footer.social?.linkedin || footer.social?.youtube || rd.get_in_touch?.social_youtube || '',

        // Settings
        'spotlight': true,
        'directory': true,
        'package-type': (company.plan?.toLowerCase() === 'verified' || company.plan?.toLowerCase() === 'premium') ? 'verified' : 'discover',

        // Schema JSON: NEW format uses seo_and_schema.jsonld_graph, OLD format uses seo_schema.seo_jsonld
        'schema-json': rd.seo_and_schema?.jsonld_graph ? JSON.stringify(rd.seo_and_schema.jsonld_graph)
          : rd.seo_schema?.seo_jsonld ? JSON.stringify(rd.seo_schema.seo_jsonld) : '',
      }
    };

    // Category: Map category name to Webflow category reference ID
    const categoryMapping: Record<string, string> = {
      'Home Services': '691da4d7eda0d581b16ab22b',
      'Health & Wellness': '691da4ce0a420347e475e570',
      'Beauty & Personal Care': '691da4c6db70c97651734905',
      'Food & Beverage': '691da4c0560d2f13a303a685',
      'Professional Services': '691da4bc29c3f5c98d2adcc6',
      'Automotive Services': '691da4b7056c7be48e03ebd6',
      'Retail & Shopping': '691da4b28e9e64e0ba1f4f00',
      'Real Estate & Housing': '691da4ab4d3f7b8e22f28f41',
      'Marketing & Creative': '691da4a5b72aefe8cefb00c5',
      'Events & Entertainment': '691da49e04e949f0d2d7863a',
      'Construction & Trades': '691da497c32ea3e47cd5d9ac',
      'Education & Training': '691da490ce99ea3a1ba03b6e',
      'Pets & Animals': '691da48a85e789d8c97df866',
      'Medical & Dental': '691da483eac72e53d40dfc85',
      'Finance & Insurance': '691da47d37873f3f2a8f90b0',
      'Technology & IT': '691da4771df75aca52c79fc6',
      'Logistics & Transportation': '691da4713b86e5a8f6c9d6bb',
      'Manufacturing & Industrial': '691da46b060d2f13a303958e',
      'Cleaning & Sanitation': '691da465c32ea3e47cd5c6b6',
      'Travel & Hospitality': '691da45e9c5e2330f6d18cf4',
      'Fitness & Sports': '691da458e6adeb59d2e42fc5',
      'Arts, Media & Publishing': '691da452dc4cac851e37ae78',
      'Nonprofit & Community': '691da44b1df75aca52c78bb0',
      'Other Services': '691da443e6adeb59d2e42802'
    };

    const categoryName = hero.category;
    if (categoryName && categoryMapping[categoryName]) {
      webflowProfile.fieldData['category'] = categoryMapping[categoryName];
      console.log(`DEBUG: Mapped category "${categoryName}" to Webflow ID: ${categoryMapping[categoryName]}`);
    } else if (categoryName) {
      console.warn(`WARNING: Category "${categoryName}" not found in mapping. Available categories: ${Object.keys(categoryMapping).join(', ')}`);
    }

    // FIX #2: Get logo from media_items table (not roma_data)
    // Try both schemas: internal_tags=['logo'] OR category='logo'
    let logoItem = await supabase
      .from('media_items')
      .select('file_url')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .contains('internal_tags', ['logo'])
      .maybeSingle();

    if (!logoItem.data) {
      logoItem = await supabase
        .from('media_items')
        .select('file_url')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .eq('category', 'logo')
        .maybeSingle();
    }

    const logoUrl = logoItem.data?.file_url || hero.hero_image_url || company.logo_url;
    if (logoUrl && !isEmpty(logoUrl)) {
      webflowProfile.fieldData['profile-image'] = { url: logoUrl };
    }

    // FIX #3: Get gallery images from media_items table
    // Get all active media, exclude logo items, OR fallback to photo_gallery from roma_data
    const { data: galleryItems } = await supabase
      .from('media_items')
      .select('file_url, internal_tags, category')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('priority', { ascending: true })
      .limit(15);

    // Filter out logo and eyes-content items (worker-only, not for profiles)
    console.log(`DEBUG: media_items before filter: ${galleryItems?.length || 0}`);
    const filteredGallery = galleryItems?.filter(item => {
      const hasLogoTag = item.internal_tags?.includes('logo');
      const hasLogoCategory = item.category === 'logo';
      const hasEyesContentTag = item.internal_tags?.includes('eyes-content');
      const hasEyesContentCategory = item.category === 'eyes-content';
      return !hasLogoTag && !hasLogoCategory && !hasEyesContentTag && !hasEyesContentCategory;
    }).slice(0, 10);
    console.log(`DEBUG: Gallery after filter: ${filteredGallery?.length || 0} images`);

    // If no media_items, try to get from roma_data photo_gallery (OLD format fallback)
    if (!filteredGallery || filteredGallery.length === 0) {
      const photoGallery = rd.photo_gallery;
      if (photoGallery && typeof photoGallery === 'object') {
        const galleryUrls: string[] = [];
        for (let i = 1; i <= 15; i++) {
          const imageKey = `image_${i}`;
          const image = photoGallery[imageKey];
          if (image && image.url && !isEmpty(image.url)) {
            galleryUrls.push(image.url);
          }
        }
        if (galleryUrls.length > 0) {
          webflowProfile.fieldData['gallery'] = galleryUrls.slice(0, 10).map(url => ({ url }));
        }
      }
    } else if (filteredGallery.length > 0) {
      webflowProfile.fieldData['gallery'] = filteredGallery.map(item => ({ url: item.file_url }));
    }

    // Remove empty fields
    Object.keys(webflowProfile.fieldData).forEach(key => {
      const value = webflowProfile.fieldData[key as keyof typeof webflowProfile.fieldData];
      if (value === '' || value === undefined || isEmpty(value)) {
        delete webflowProfile.fieldData[key as keyof typeof webflowProfile.fieldData];
      }
    });

    // Check if profile already exists
    const listResponse = await fetch(
      `https://api.webflow.com/v2/collections/${COLLECTIONS.PROFILES}/items`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${webflowToken}`,
          'accept': 'application/json'
        }
      }
    );

    let existingItem = null;
    if (listResponse.ok) {
      const listData = await listResponse.json();
      existingItem = listData.items?.find((item: any) => item.fieldData?.slug === slug);
    }

    // Create or update the profile
    let profileResponse;
    if (existingItem) {
      console.log(`✏️  Updating existing profile...`);
      profileResponse = await fetch(
        `https://api.webflow.com/v2/collections/${COLLECTIONS.PROFILES}/items/${existingItem.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${webflowToken}`,
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify(webflowProfile)
        }
      );
    } else {
      console.log(`➕ Creating new profile...`);
      profileResponse = await fetch(
        `https://api.webflow.com/v2/collections/${COLLECTIONS.PROFILES}/items`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${webflowToken}`,
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify(webflowProfile)
        }
      );
    }

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      return NextResponse.json(
        { error: 'Failed to sync profile to Webflow', details: errorText },
        { status: 500 }
      );
    }

    const profileItem = await profileResponse.json();
    const profileWebflowId = profileItem.id;
    console.log(`✅ Profile synced: ${profileWebflowId}`);

    // ============================================
    // STEP 2: Delete existing child items
    // ============================================
    console.log(`🗑️  Cleaning up old child items...`);

    for (const [collectionName, collectionId] of Object.entries(COLLECTIONS)) {
      if (collectionName === 'PROFILES') continue;

      const itemsResponse = await fetch(
        `https://api.webflow.com/v2/collections/${collectionId}/items`,
        {
          headers: {
            'Authorization': `Bearer ${webflowToken}`,
            'accept': 'application/json'
          }
        }
      );

      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        console.log(`DEBUG: ${collectionName} total items: ${itemsData.items?.length || 0}, profileWebflowId: ${profileWebflowId}`);

        const childItems = itemsData.items?.filter((item: any) => {
          const matches = item.fieldData?.profile === profileWebflowId;
          if (collectionName === 'SERVICES' && itemsData.items?.length > 0 && itemsData.items.length < 3) {
            console.log(`DEBUG: ${collectionName} item profile: ${item.fieldData?.profile}, matches: ${matches}`);
          }
          return matches;
        }) || [];

        for (const item of childItems) {
          await fetch(
            `https://api.webflow.com/v2/collections/${collectionId}/items/${item.id}`,
            {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${webflowToken}` }
            }
          );
        }
        console.log(`  Deleted ${childItems.length} old ${collectionName.toLowerCase()}`);
      }
    }

    // ============================================
    // STEP 3: Sync Services (BOTH formats)
    // ============================================
    const serviceIds: string[] = [];
    let servicesCount = 0;

    // Handle NEW format (Zoroco): services as ARRAY
    let servicesArray: any[] = [];
    if (Array.isArray(rd.services)) {
      servicesArray = rd.services;
    }
    // Handle OLD format (Major Dumpsters): services.service_1, service_2, etc.
    else if (rd.services && typeof rd.services === 'object') {
      for (let i = 1; i <= 10; i++) {
        const serviceKey = `service_${i}`;
        if (rd.services[serviceKey]) {
          servicesArray.push(rd.services[serviceKey]);
        }
      }
    }

    console.log(`DEBUG: servicesArray.length = ${servicesArray.length}`);

    for (let i = 0; i < Math.min(servicesArray.length, 5); i++) {
      const service = servicesArray[i];
      console.log(`DEBUG: Service ${i}: title="${service?.title}", isEmpty=${isEmpty(service?.title)}`);
      if (!service || isEmpty(service.title)) continue;

      // Handle whats_included: NEW format is array, OLD format is included_1, included_2, etc.
      let included1 = '';
      let included2 = '';
      let included3 = '';
      let included4 = '';

      if (Array.isArray(service.whats_included)) {
        // NEW format
        included1 = service.whats_included[0] || '';
        included2 = service.whats_included[1] || '';
        included3 = service.whats_included[2] || '';
        included4 = service.whats_included[3] || '';
      } else if (service.included_1 || service.included_2 || service.included_3 || service.included_4) {
        // OLD format
        included1 = service.included_1 || '';
        included2 = service.included_2 || '';
        included3 = service.included_3 || '';
        included4 = service.included_4 || '';
      }

      const servicePayload = {
        fieldData: {
          name: service.title,
          slug: `${slug}-service-${generateSlugHash()}`,
          'price-estimate': service.pricing_label || service.price || '',
          'description': service.summary_1line || service.description || '',
          'duration': service.duration || '',
          'included1': included1,
          'included2': included2,
          'included3': included3,
          'included4': included4,
          'profile': profileWebflowId,
        }
      };

      console.log(`DEBUG: Service ${i} included values: [${included1 ? '✓' : '✗'}] [${included2 ? '✓' : '✗'}] [${included3 ? '✓' : '✗'}] [${included4 ? '✓' : '✗'}]`);

      const serviceResponse = await fetch(
        `https://api.webflow.com/v2/collections/${COLLECTIONS.SERVICES}/items`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${webflowToken}`,
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify(servicePayload)
        }
      );

      if (serviceResponse.ok) {
        const serviceItem = await serviceResponse.json();
        serviceIds.push(serviceItem.id);
        servicesCount++;
      } else {
        const errorText = await serviceResponse.text();
        console.log(`DEBUG: Service ${i} POST failed (${serviceResponse.status}): ${errorText.substring(0, 200)}`);
      }
    }
    console.log(`✅ Services synced: ${servicesCount}`);

    // ============================================
    // STEP 4: Sync FAQs (BOTH formats)
    // ============================================
    const allQuestions: any[] = [];

    // Handle NEW format (Zoroco): faqs.all_questions with nested categories
    if (rd.faqs?.all_questions) {
      Object.values(rd.faqs.all_questions).forEach((category: any) => {
        if (Array.isArray(category)) {
          allQuestions.push(...category);
        }
      });
    }
    // Handle OLD format (Major Dumpsters): faqs.faq_1, faq_2, etc.
    else if (rd.faqs && typeof rd.faqs === 'object') {
      for (let i = 1; i <= 20; i++) {
        const faqKey = `faq_${i}`;
        if (rd.faqs[faqKey]) {
          allQuestions.push(rd.faqs[faqKey]);
        }
      }
    }

    const faqIds: string[] = [];
    let faqsCount = 0;

    for (let i = 0; i < Math.min(allQuestions.length, 10); i++) {
      const faq = allQuestions[i];
      if (!faq || isEmpty(faq.question)) continue;

      const faqPayload = {
        fieldData: {
          name: faq.question,
          slug: slugify(`${slug}-faq-${i}`),
          'answer': faq.answer || '',
          'publish-date': new Date().toISOString(),
          'profile': profileWebflowId,
        }
      };

      const faqResponse = await fetch(
        `https://api.webflow.com/v2/collections/${COLLECTIONS.FAQS}/items`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${webflowToken}`,
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify(faqPayload)
        }
      );

      if (faqResponse.ok) {
        const faqItem = await faqResponse.json();
        faqIds.push(faqItem.id);
        faqsCount++;
      }
    }
    console.log(`✅ FAQs synced: ${faqsCount}`);

    // ============================================
    // STEP 5: Sync Scenarios (BOTH formats)
    // ============================================
    const scenarioIds: string[] = [];
    let scenariosCount = 0;

    // Handle NEW format (Zoroco): what_to_expect as ARRAY
    let scenariosArray: any[] = [];
    if (Array.isArray(rd.what_to_expect)) {
      scenariosArray = rd.what_to_expect;
    }
    // Handle OLD format (Major Dumpsters): what_to_expect.scenario_1, scenario_2, etc.
    else if (rd.what_to_expect && typeof rd.what_to_expect === 'object') {
      for (let i = 1; i <= 10; i++) {
        const scenarioKey = `scenario_${i}`;
        if (rd.what_to_expect[scenarioKey]) {
          scenariosArray.push(rd.what_to_expect[scenarioKey]);
        }
      }
    }

    for (let i = 0; i < Math.min(scenariosArray.length, 5); i++) {
      const scenario = scenariosArray[i];
      if (!scenario || isEmpty(scenario.title)) continue;

      // Handle whats_involved as array (new format) or involved_1, involved_2, etc. (old format)
      const whatsInvolved = Array.isArray(scenario.whats_involved)
        ? scenario.whats_involved
        : [
            scenario.involved_1 || '',
            scenario.involved_2 || '',
            scenario.involved_3 || '',
            scenario.involved_4 || ''
          ].filter(item => item !== '');

      const scenarioPayload = {
        fieldData: {
          name: scenario.title,
          slug: slugify(`${slug}-scenario-${i}`),
          'recommended': scenario.recommended_for || scenario.recommended || '',
          'pro-tip': scenario.pro_tip || '',
          'whats-involved1': whatsInvolved[0] || '',
          'whats-involved2': whatsInvolved[1] || '',
          'whats-involved3': whatsInvolved[2] || '',
          'whats-involved4': whatsInvolved[3] || '',
          'profile': profileWebflowId,
        }
      };

      const scenarioResponse = await fetch(
        `https://api.webflow.com/v2/collections/${COLLECTIONS.SCENARIOS}/items`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${webflowToken}`,
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify(scenarioPayload)
        }
      );

      if (scenarioResponse.ok) {
        const scenarioItem = await scenarioResponse.json();
        scenarioIds.push(scenarioItem.id);
        scenariosCount++;
      }
    }
    console.log(`✅ Scenarios synced: ${scenariosCount}`);

    // ============================================
    // STEP 6: Sync Locations (BOTH formats)
    // ============================================
    const locationIds: string[] = [];
    let locationsCount = 0;

    // Check if location has address (either format)
    const hasAddress = primaryLocation && (primaryLocation.address_line1 || primaryLocation.address_1);

    if (hasAddress) {
      // NEW format uses address_line1, OLD format uses address_1
      const streetAddress = primaryLocation.address_line1 || primaryLocation.address_1 || '';

      // Extract postal code from different sources
      let postalCode = '';
      if (primaryLocation.address_line1) {
        // New format: extract from city_state_zip
        const cityStateZip = primaryLocation.city_state_zip || '';
        const match = cityStateZip.match(/^(.+),\s*([A-Z]{2})\s+(\d{5})$/);
        postalCode = match?.[3] || '';
      } else if (primaryLocation.address_2) {
        // Old format: extract from address_2
        const match = primaryLocation.address_2?.match(/^(.+),\s*([A-Z]{2})\s+(\d{5})$/);
        postalCode = match?.[3] || '';
      }

      const locationPayload = {
        fieldData: {
          name: primaryLocation.name || city || 'Primary Location',
          slug: slugify(`${slug}-location-primary`),
          'street-address': streetAddress,
          'city': city,
          'state': state,
          'postal-code': postalCode,
          'get-directions': hero.quick_actions?.maps_link || footer.get_directions_url || '',
          // Hours: NEW format uses hours_note, OLD format uses hours_mon, hours_tue, etc.
          'hours-monday': rd.locations_and_hours?.hours_note || primaryLocation.hours_mon || '',
          'hours-tuesday': rd.locations_and_hours?.hours_note || primaryLocation.hours_tue || '',
          'hours-wednesday': rd.locations_and_hours?.hours_note || primaryLocation.hours_wed || '',
          'hours-thursday': rd.locations_and_hours?.hours_note || primaryLocation.hours_thu || '',
          'hours-friday': rd.locations_and_hours?.hours_note || primaryLocation.hours_fri || '',
          'hours-saturday': rd.locations_and_hours?.hours_note || primaryLocation.hours_sat || '',
          'hours-sunday': rd.locations_and_hours?.hours_note || primaryLocation.hours_sun || '',
          'service-area': rd.locations_and_hours?.service_area_text || primaryLocation.service_area || '',
          'profile': profileWebflowId,
        }
      };

      const locationResponse = await fetch(
        `https://api.webflow.com/v2/collections/${COLLECTIONS.LOCATIONS}/items`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${webflowToken}`,
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify(locationPayload)
        }
      );

      if (locationResponse.ok) {
        const locationItem = await locationResponse.json();
        locationIds.push(locationItem.id);
        locationsCount++;
      }
    }
    console.log(`✅ Locations synced: ${locationsCount}`);

    // ============================================
    // STEP 7: Sync Reviews (from reviews TABLE)
    // FIX #1: Pull from database where VAs edit in Step 3
    // ============================================
    const { data: dbReviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(5);

    const reviewIds: string[] = [];
    let reviewsCount = 0;

    console.log(`DEBUG: dbReviews count = ${dbReviews?.length || 0}`);

    if (dbReviews && dbReviews.length > 0) {
      for (let i = 0; i < dbReviews.length; i++) {
        const review = dbReviews[i];
        console.log(`DEBUG: Review ${i}: author="${review?.author}", isEmpty=${isEmpty(review?.author)}`);
        if (!review || isEmpty(review.author)) continue;

        const reviewPayload = {
          fieldData: {
            name: review.author,
            slug: `${slug}-review-${generateSlugHash()}`,
            'review-text': review.text || '',
            'review-source-company': review.platform || '',
            'review-title': review.date || '',
            'profile': profileWebflowId,
          }
        };

        const reviewResponse = await fetch(
          `https://api.webflow.com/v2/collections/${COLLECTIONS.REVIEWS}/items`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${webflowToken}`,
              'Content-Type': 'application/json',
              'accept': 'application/json'
            },
            body: JSON.stringify(reviewPayload)
          }
        );

        if (reviewResponse.ok) {
          const reviewItem = await reviewResponse.json();
          reviewIds.push(reviewItem.id);
          reviewsCount++;
        } else {
          const errorText = await reviewResponse.text();
          console.log(`DEBUG: Review ${i} POST failed (${reviewResponse.status}): ${errorText.substring(0, 200)}`);
        }
      }
    }
    console.log(`✅ Reviews synced: ${reviewsCount}`);

    // ============================================
    // STEP 7.5: Sync Quick Reference Guide (SERVICES_REFERENCES)
    // OLD format: quick_reference_guide.row_1-5 with col_1-5
    // ============================================
    const serviceReferenceIds: string[] = [];
    let serviceReferencesCount = 0;

    if (rd.quick_reference_guide && typeof rd.quick_reference_guide === 'object') {
      const qrg = rd.quick_reference_guide;

      // Extract rows (row_1 through row_5)
      for (let i = 1; i <= 10; i++) {
        const rowKey = `row_${i}`;
        const row = qrg[rowKey];
        if (!row || !row.col_1) continue; // col_1 is the service name

        const serviceRefPayload = {
          fieldData: {
            name: row.col_1 || `Service ${i}`,
            slug: slugify(`${slug}-service-ref-${i}`),
            'duration': row.col_2 || '', // Dimensions/Duration
            'complexity': row.col_3 || '', // Best For/Complexity
            'best-for': row.col_3 || '', // Best For
            'price-range': row.col_5 || '', // Starting Price
            'profile': profileWebflowId,
          }
        };

        const serviceRefResponse = await fetch(
          `https://api.webflow.com/v2/collections/${COLLECTIONS.SERVICES_REFERENCES}/items`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${webflowToken}`,
              'Content-Type': 'application/json',
              'accept': 'application/json'
            },
            body: JSON.stringify(serviceRefPayload)
          }
        );

        if (serviceRefResponse.ok) {
          const serviceRefItem = await serviceRefResponse.json();
          serviceReferenceIds.push(serviceRefItem.id);
          serviceReferencesCount++;
        }
      }
    }
    console.log(`✅ Service References synced: ${serviceReferencesCount}`);

    // ============================================
    // STEP 8: Publish everything to live site
    // ============================================
    const allItemIds = [
      profileWebflowId,
      ...serviceIds,
      ...faqIds,
      ...scenarioIds,
      ...locationIds,
      ...reviewIds,
      ...serviceReferenceIds
    ];

    // Publish in batches
    for (const [collectionName, collectionId] of Object.entries(COLLECTIONS)) {
      const collectionItems = collectionName === 'PROFILES' ? [profileWebflowId] :
                             collectionName === 'SERVICES' ? serviceIds :
                             collectionName === 'FAQS' ? faqIds :
                             collectionName === 'SCENARIOS' ? scenarioIds :
                             collectionName === 'LOCATIONS' ? locationIds :
                             collectionName === 'REVIEWS' ? reviewIds :
                             collectionName === 'SERVICES_REFERENCES' ? serviceReferenceIds :
                             [];

      if (collectionItems.length === 0) continue;

      const publishResponse = await fetch(
        `https://api.webflow.com/v2/collections/${collectionId}/items/publish`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${webflowToken}`,
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify({ itemIds: collectionItems })
        }
      );

      if (publishResponse.ok) {
        console.log(`📢 Published ${collectionItems.length} ${collectionName.toLowerCase()}`);
      }
    }

    // ============================================
    // STEP 9: Update company sync status
    // ============================================
    const { data: updatedCompany, error: updateError } = await supabase
      .from('companies')
      .update({
        webflow_published: true,
        webflow_slug: slug,
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', companyId)
      .select();

    if (updateError) {
      console.error('❌ Error updating company database:', updateError);
      throw new Error(`Failed to update company database: ${updateError.message}`);
    }

    console.log('✅ Company database updated:', updatedCompany);
    console.log(`\n✨ Full sync complete for ${hero.business_name || company.name}!`);

    return NextResponse.json({
      success: true,
      message: `Successfully published ${hero.business_name || company.name} to Webflow`,
      slug: slug,
      liveUrl: `${WEBFLOW_PREVIEW_DOMAIN}/profile/${slug}`,
      synced: {
        profile: { id: profileWebflowId, fieldsPopulated: Object.keys(webflowProfile.fieldData).length },
        services: { count: servicesCount, ids: serviceIds },
        faqs: { count: faqsCount, ids: faqIds },
        scenarios: { count: scenariosCount, ids: scenarioIds },
        locations: { count: locationsCount, ids: locationIds },
        reviews: { count: reviewsCount, ids: reviewIds },
        serviceReferences: { count: serviceReferencesCount, ids: serviceReferenceIds },
      },
      totalItemsSynced: allItemIds.length,
    });

  } catch (error) {
    console.error('Publish company error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish company' },
      { status: 500 }
    );
  }
}
