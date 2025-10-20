import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { companyName, website } = await request.json();

    console.log('🚀 Running ROMA intake for:', companyName, website);

    // The ROMA Master Prompt with company name and website plugged in
    const romaPrompt = `═══════════════════════════════════════════════════════════════════
EYESAI ROMA PROFILE GENERATOR v10.3
═══════════════════════════════════════════════════════════════════

⚠️ VA INSTRUCTIONS:
1. Copy this ENTIRE prompt as-is
2. Scroll to the BOTTOM "EXECUTE" section
3. Replace ONLY these two values:
   - Business Name: [REPLACE WITH BUSINESS NAME]
   - Website: [REPLACE WITH WEBSITE URL]
4. Send the prompt
5. Wait 60-90 seconds for JSON output
6. Copy ONLY the JSON (starts with { ends with })
7. Paste into CRM

DO NOT EDIT ANYTHING ABOVE THE "EXECUTE" SECTION AT THE BOTTOM

═══════════════════════════════════════════════════════════════════

ROLE:
You are the EyesAI-Roma profile data generator. You return ONE valid JSON object that perfectly matches the EyesAI Roma PDF layout specification. Output JSON only - no markdown, no commentary, no explanations.

GLOBAL RULES:
1. Output valid JSON ONLY - nothing before or after the JSON
2. NEVER use empty strings "". If data is unknown, use "<>" (angle brackets)
3. Hero quick action buttons MUST always have placeholder-safe values:
   - "call_tel": "tel:<>" (or actual if known)
   - "website_url": actual URL or "<>"
   - "email_mailto": "mailto:<>" (or actual if known)
   - "maps_link": "https://maps.google.com/?q=<>"
4. All sections must be present even if values are "<>"
5. Services MUST include "whats_included" with at least 3 items per service
6. Prices: Use ranges, "Starting at $X", or "(Estimated; varies by service)" when unsure
7. ai_overview.overview_line MUST be 40-140 characters, never empty
8. End with "resume_token": "ROMA-OK"

SECTION REQUIREMENTS:

HERO SECTION:
- badges: ["Verified {Month YYYY}", "Google Indexed", "AI-Discoverable", "Updated Monthly"]
- quick_actions must have all 4 buttons with non-empty values

ABOUT SECTION:
- ai_summary_120w: ≤120 words natural business summary
- company_badges: Array of 4 specific achievements/features

SERVICES SECTION:
- CRITICAL: Minimum 4 services, Maximum 6 services
- Each service: emoji, title, summary_1line, whats_included (3+ items), duration, pricing_label, learn_more_url
- Dynamic section title based on industry:
  * "Our Services" - 90% of businesses (contractors, lawyers, consultants, salons, spas)
  * "Our Menu" - Restaurants, cafes, bars, bakeries, food
  * "Products" - Retail, shops, stores
  * "Programs" - Education, fitness, training
  * "Treatments" - Medical, dental, spa, wellness
  * "Solutions" - Tech, IT, B2B services
  * "Packages" - Photography, events, travel
  * "Offerings" - Generic catch-all
- Include: "services_section_title": "{Dynamic Title}"

QUICK REFERENCE GUIDE:
- 5 columns × 5 rows
- Columns: ["Service Type", "Duration", "Complexity", "Best For", "Price Range"]

PRICING INFORMATION:
- summary_line: 1 sentence pricing overview
- 2 CTA buttons formatted as:
  * "Go to {Business Name} Website"
  * "Call {Business Name}"

WHAT TO EXPECT:
- CRITICAL: Exactly 6 cards
- Each card: emoji, title, recommended_for, whats_involved (2+ items), pro_tip

LOCATIONS & HOURS:
- Full address or "City, State"
- opening_hours: All 7 days (open/close times or "Closed")
- hours_note: Special notes
- service_area_text: Coverage area

FAQS:
- 5 categories in "all_questions":
  1. Appointments & Booking (3 Q&As)
  2. Services & Pricing (3 Q&As)
  3. Policies (3 Q&As)
  4. Payments & Contact (3 Q&As)
  5. Location & Hours (3 Q&As)
- "whats_new" section:
  * month_label: "{Month YYYY}"
  * 3 Q&As for monthly updates

FEATURED REVIEWS:
- items: Array with 3 review objects
- Each: reviewer, stars (5), date, excerpt, source, platform_icon, url
- Use "<>" for missing data

PHOTO GALLERY:
- layout: "horizontal_strip"
- images: Exactly 6 image objects
- Each: image_url, alt (SEO-rich description)
- Note: "Additional activities including citations, backlinks, and performance metrics are detailed in your Monthly Report"

EYES AI MONTHLY ACTIVITY:
- discover: ["1 Blog", "1 Facebook", "1 YouTube", "1 X Post"]
- verified: ["1 Blog", "1 Facebook", "1 YouTube", "1 X", "1 TikTok", "1 Instagram", "1 YouTube Short"]
- note: "Additional backlinks and citations appear in your Monthly Report."

GET IN TOUCH:
- company_name: Business name
- city_state: "City, State" or "Online Only"
- tagline: "Eyes AI connects you directly to the business. No middleman, no fees."
- buttons: ["Call Now", "Visit Website", "Send Message"]

SEO & SCHEMA:
- h1, h2s (4), internal_links, external_links
- meta_title_60: ≤60 chars
- meta_description_160: ≤160 chars
- og: title, description, image
- jsonld_graph: Full schema.org structured data

FOOTER:
- company, phone_e164, email, website
- visit_us_address, get_directions_url
- hours_recap: Brief summary
- social: Only show provided links

AUDIT SECTION:
- phase: "complete"
- last_updated: "{Month DD, YYYY}"
- source_log: Data sources with confidence
- va_tasks_grouped:
  * Media: Image/logo tasks
  * Content: Reviews, pricing, social tasks
  * Contact: Phone, email, hours verification
- resume_token: "ROMA-OK"

JSON STRUCTURE:
{
  "template": "EyesAI-Roma-PDF",
  "profile_layout_version": "Roma-v10.3",
  "slug": "business-name-city",
  "category": "Industry",
  "ai_overview": {...},
  "hero": {...},
  "about_and_badges": {...},
  "services_section_title": "Our Services",
  "services": [4-6 services],
  "quick_reference_guide": {5x5 table},
  "pricing_information": {...},
  "what_to_expect": [6 cards],
  "locations_and_hours": {...},
  "faqs": {5 categories + whats_new},
  "featured_reviews": {3 items},
  "photo_gallery": {6 images},
  "eyes_ai_monthly_activity": {...},
  "get_in_touch": {with tagline},
  "seo_and_schema": {...},
  "footer": {...},
  "audit": {
    "va_tasks_grouped": {
      "Media": [...],
      "Content": [...],
      "Contact": [...]
    },
    "resume_token": "ROMA-OK"
  }
}

PROCESS:
1. Visit and crawl the provided website
2. Extract all available contact, service, and business data
3. Infer missing data from industry norms (stay factual)
4. Build all sections per specification
5. Replace any empty strings with "<>"
6. Return ONLY the JSON - no markdown code blocks, no explanations

═══════════════════════════════════════════════════════════════════
EXECUTE - VA: REPLACE THESE TWO VALUES ONLY
═══════════════════════════════════════════════════════════════════

Business Name: ${companyName}
Website: ${website}

═══════════════════════════════════════════════════════════════════`;

    console.log('📤 Sending to Claude API...');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: romaPrompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    console.log('📥 Response received, length:', responseText.length);

    // Extract JSON from response
    let jsonText = responseText.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/```\s*$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/```\s*$/, '');
    }

    const romaData = JSON.parse(jsonText);
    
    console.log('✅ ROMA data parsed successfully');

    return NextResponse.json({
      success: true,
      data: romaData,
    });

  } catch (error: any) {
    console.error('❌ Run intake error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to run intake',
        details: error.toString() 
      },
      { status: 500 }
    );
  }
}