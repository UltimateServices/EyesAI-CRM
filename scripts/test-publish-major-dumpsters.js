const fs = require('fs');
const path = require('path');

// Load .env.local manually
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envFile = fs.readFileSync(envPath, 'utf8');
    const lines = envFile.split('\n');

    for (const line of lines) {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        process.env[key] = value;
      }
    }
  } catch (err) {
    console.error('Error loading .env.local:', err.message);
  }
}

loadEnv();

async function testPublishMajorDumpsters() {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const webflowToken = process.env.WEBFLOW_CMS_SITE_API_TOKEN;

  if (!webflowToken) {
    console.error('❌ WEBFLOW_CMS_SITE_API_TOKEN not found in .env.local');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const companyId = 'ea5eb06d-5f2d-4d0f-b713-bd0e61193b39';

  console.log('\n🚀 Testing Webflow publish for Major Dumpsters...\n');
  console.log(`Company ID: ${companyId}\n`);

  // This is basically the same logic as the publish endpoint
  // but we're running it directly with service role permissions

  const WEBFLOW_SITE_ID = process.env.WEBFLOW_SITE_ID || '68db778020fc2ac5c78f401a';

  const COLLECTIONS = {
    PROFILES: '6919a7f067ba553645e406a6',
    SERVICES: '691b7c75c939d316cb7f73b0',
    FAQS: '692411f2a535a2edbb68ecea',
    SCENARIOS: '692591ebc2715ac9182e11d6',
    LOCATIONS: '6925a0fc2f4eac43ffd125f6',
    REVIEWS: '6917304967a914982fd205bc'
  };

  function slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function isEmpty(value) {
    return !value || value === '<>' || value === '' || value === 'null' || value === 'undefined';
  }

  try {
    // Get company
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (!company) {
      console.error('❌ Company not found');
      return;
    }

    console.log(`✅ Found company: ${company.name}\n`);

    // Get intake
    const { data: intake } = await supabase
      .from('intakes')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (!intake || !intake.roma_data) {
      console.error('❌ No intake data found');
      return;
    }

    const rd = intake.roma_data;
    console.log(`✅ Loaded ROMA data (${Object.keys(rd).length} sections)\n`);

    // Get reviews from database
    const { data: dbReviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log(`✅ Found ${dbReviews?.length || 0} active reviews\n`);

    // Get media items
    const { data: logoItem } = await supabase
      .from('media_items')
      .select('file_url')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .contains('internal_tags', ['logo'])
      .single();

    const { data: galleryItems } = await supabase
      .from('media_items')
      .select('file_url')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .not('internal_tags', 'cs', '{"logo"}')
      .order('priority', { ascending: true })
      .limit(10);

    console.log(`✅ Found logo: ${logoItem ? 'YES' : 'NO'}`);
    console.log(`✅ Found gallery images: ${galleryItems?.length || 0}\n`);

    console.log('📤 Starting Webflow sync...\n');

    // Create the profile
    const hero = rd.hero || {};
    const about = rd.about_and_badges || rd.about || {};
    const aiOverview = rd.ai_overview || {};
    const seo = rd.seo_and_schema || {};

    const slug = slugify(hero.business_name || company.name);

    const logoUrl = logoItem?.file_url || hero.hero_image_url || company.logo_url;

    const webflowProfile = {
      fieldData: {
        name: hero.business_name || company.name,
        slug: slug,
        'business-name': hero.business_name || company.name
      }
    };

    if (!isEmpty(hero.tagline)) webflowProfile.fieldData['tagline'] = hero.tagline;
    if (!isEmpty(aiOverview.ai_summary)) webflowProfile.fieldData['ai-summary'] = aiOverview.ai_summary;
    if (!isEmpty(about.about_text)) webflowProfile.fieldData['about-text'] = about.about_text;
    if (!isEmpty(seo.meta_description)) webflowProfile.fieldData['meta-description'] = seo.meta_description;
    if (logoUrl && !isEmpty(logoUrl)) webflowProfile.fieldData['profile-image'] = { url: logoUrl };
    if (galleryItems && galleryItems.length > 0) {
      webflowProfile.fieldData['gallery'] = galleryItems.map(item => ({ url: item.file_url }));
    }

    console.log('1️⃣ Creating Profile...');
    const profileResponse = await fetch(
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

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error(`❌ Profile creation failed: ${profileResponse.status}`);
      console.error(errorText);
      return;
    }

    const profileItem = await profileResponse.json();
    const profileWebflowId = profileItem.id;
    console.log(`   ✅ Profile created: ${profileWebflowId}\n`);

    // Count syncs
    let servicesCount = 0;
    let faqsCount = 0;
    let scenariosCount = 0;
    let locationsCount = 0;
    let reviewsCount = 0;

    // Sync services (sample - just count)
    const services = Array.isArray(rd.services) ? rd.services : [];
    servicesCount = Math.min(services.length, 5);
    console.log(`2️⃣ Would sync ${servicesCount} services`);

    // Sync FAQs (sample - just count)
    if (rd.faqs?.all_questions) {
      const allFaqs = [];
      Object.values(rd.faqs.all_questions).forEach(category => {
        if (Array.isArray(category)) allFaqs.push(...category);
      });
      faqsCount = Math.min(allFaqs.length, 10);
      console.log(`3️⃣ Would sync ${faqsCount} FAQs`);
    }

    // Sync scenarios
    const scenarios = Array.isArray(rd.what_to_expect) ? rd.what_to_expect : [];
    scenariosCount = Math.min(scenarios.length, 5);
    console.log(`4️⃣ Would sync ${scenariosCount} scenarios`);

    // Sync location
    if (rd.locations_and_hours?.primary_location) {
      locationsCount = 1;
      console.log(`5️⃣ Would sync ${locationsCount} location`);
    }

    // Sync reviews
    if (dbReviews && dbReviews.length > 0) {
      reviewsCount = dbReviews.length;
      console.log(`6️⃣ Would sync ${reviewsCount} reviews`);
    } else {
      console.log(`6️⃣ Would sync 0 reviews (none in database)`);
    }

    console.log('\n✅ Publish test complete!\n');
    console.log('📊 Summary:');
    console.log(`   Profile: 1`);
    console.log(`   Services: ${servicesCount}`);
    console.log(`   FAQs: ${faqsCount}`);
    console.log(`   Scenarios: ${scenariosCount}`);
    console.log(`   Locations: ${locationsCount}`);
    console.log(`   Reviews: ${reviewsCount}`);
    console.log('');
    console.log(`🌐 Profile URL: https://eyesai.ai/companies/${slug}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testPublishMajorDumpsters().catch(console.error);
