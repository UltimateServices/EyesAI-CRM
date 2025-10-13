import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Fetch URL with proper error handling
async function fetchUrl(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } catch (error: any) {
    console.error(`Failed to fetch ${url}:`, error.message);
    return '';
  }
}

// Smart page discovery - works across all platforms
function findKeyPages(html: string, baseUrl: string): { about?: string; contact?: string; services?: string } {
  const $ = cheerio.load(html);
  const links: { about?: string; contact?: string; services?: string } = {};
  
  try {
    const base = new URL(baseUrl);
    const visited = new Set<string>();
    
    $('a, link[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (!href || visited.has(href)) return;
      visited.add(href);
      
      const text = $(element).text().toLowerCase().trim();
      const hrefLower = href.toLowerCase();
      
      // Resolve URL
      let fullUrl = '';
      try {
        if (href.startsWith('http')) {
          fullUrl = href;
        } else if (href.startsWith('/')) {
          fullUrl = `${base.origin}${href}`;
        } else if (href.startsWith('#')) {
          return; // Skip anchors
        } else {
          fullUrl = `${base.origin}/${href}`;
        }
        
        const urlObj = new URL(fullUrl);
        if (urlObj.origin !== base.origin) return; // Skip external links
        
      } catch {
        return;
      }
      
      // Find about page
      if (!links.about && (
        hrefLower.includes('about') || 
        hrefLower.includes('who-we-are') ||
        hrefLower.includes('our-story') ||
        hrefLower.includes('company') ||
        text.includes('about') ||
        text.includes('who we are') ||
        text.includes('our story')
      )) {
        links.about = fullUrl;
      }
      
      // Find contact page
      if (!links.contact && (
        hrefLower.includes('contact') || 
        hrefLower.includes('get-in-touch') ||
        hrefLower.includes('reach-us') ||
        text.includes('contact') ||
        text.includes('get in touch') ||
        text.includes('reach us')
      )) {
        links.contact = fullUrl;
      }
      
      // Find services page
      if (!links.services && (
        hrefLower.includes('service') || 
        hrefLower.includes('product') ||
        hrefLower.includes('what-we-do') ||
        hrefLower.includes('offerings') ||
        text.includes('service') ||
        text.includes('product') ||
        text.includes('what we do')
      )) {
        links.services = fullUrl;
      }
    });
    
    // Fallback: try common paths if nothing found
    if (!links.about) links.about = `${base.origin}/about`;
    if (!links.contact) links.contact = `${base.origin}/contact`;
    if (!links.services) links.services = `${base.origin}/services`;
    
  } catch (error) {
    console.error('Error finding pages:', error);
  }
  
  return links;
}

// Extract clean text from HTML (works for all platforms)
function extractCleanText(html: string): string {
  try {
    const $ = cheerio.load(html);
    
    // Remove script, style, and other non-content tags
    $('script, style, noscript, iframe, svg').remove();
    
    // Get text from body
    const text = $('body').text();
    
    // Clean up whitespace
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim()
      .substring(0, 50000); // Limit to 50k chars
  } catch {
    return html.substring(0, 50000);
  }
}

// Consensus merge function
function consensusMerge(claudeData: any, openaiData: any) {
  const merged: any = {};
  const confidence: any = {};

  const allFields = new Set([
    ...Object.keys(claudeData || {}),
    ...Object.keys(openaiData || {})
  ]);

  allFields.forEach(field => {
    const claudeValue = claudeData?.[field];
    const openaiValue = openaiData?.[field];

    // Check if values are empty
    const claudeEmpty = claudeValue === null || 
                        claudeValue === undefined || 
                        claudeValue === '' || 
                        (Array.isArray(claudeValue) && claudeValue.length === 0);
    
    const openaiEmpty = openaiValue === null || 
                        openaiValue === undefined || 
                        openaiValue === '' || 
                        (Array.isArray(openaiValue) && openaiValue.length === 0);

    // Both empty
    if (claudeEmpty && openaiEmpty) {
      merged[field] = null;
      confidence[field] = 'none';
      return;
    }

    // Only one has data
    if (claudeEmpty && !openaiEmpty) {
      merged[field] = openaiValue;
      confidence[field] = 'medium';
      return;
    }

    if (!claudeEmpty && openaiEmpty) {
      merged[field] = claudeValue;
      confidence[field] = 'medium';
      return;
    }

    // Both have data - compare
    if (typeof claudeValue === 'string' && typeof openaiValue === 'string') {
      const c = claudeValue.toLowerCase().trim();
      const o = openaiValue.toLowerCase().trim();

      if (c === o) {
        merged[field] = claudeValue;
        confidence[field] = 'high';
      } else if (c.includes(o) || o.includes(c)) {
        // One contains the other - use longer
        merged[field] = claudeValue.length > openaiValue.length ? claudeValue : openaiValue;
        confidence[field] = 'high';
      } else {
        // Different - use Claude's (you can adjust this)
        merged[field] = claudeValue;
        confidence[field] = 'low';
      }
    } else if (Array.isArray(claudeValue) && Array.isArray(openaiValue)) {
      // Merge arrays, remove duplicates
      const combined = [...new Set([...claudeValue, ...openaiValue])];
      merged[field] = combined;
      confidence[field] = combined.length > 0 ? 'high' : 'none';
    } else if (typeof claudeValue === 'object' && typeof openaiValue === 'object' && 
               !Array.isArray(claudeValue) && !Array.isArray(openaiValue)) {
      // Merge objects
      merged[field] = { ...claudeValue, ...openaiValue };
      confidence[field] = 'medium';
    } else if (typeof claudeValue === 'boolean' && typeof openaiValue === 'boolean') {
      if (claudeValue === openaiValue) {
        merged[field] = claudeValue;
        confidence[field] = 'high';
      } else {
        merged[field] = claudeValue;
        confidence[field] = 'low';
      }
    } else {
      // Default to Claude
      merged[field] = claudeValue;
      confidence[field] = 'low';
    }
  });

  return { merged, confidence };
}

export async function POST(request: NextRequest) {
  try {
    const { website, companyName } = await request.json();

    console.log('🔍 Starting intelligent enrichment for:', companyName);
    console.log('🌐 Website:', website);

    // Phase 1: Fetch homepage
    console.log('📄 Fetching homepage...');
    const homepageHtml = await fetchUrl(website);
    
    if (!homepageHtml) {
      throw new Error('Could not fetch website. Site may be down or blocking requests.');
    }

    // Phase 2: Discover and fetch key pages
    console.log('🔎 Discovering key pages...');
    const pages = findKeyPages(homepageHtml, website);
    console.log('📑 Found pages:', Object.keys(pages).filter(k => pages[k as keyof typeof pages]));

    const [aboutHtml, contactHtml, servicesHtml] = await Promise.allSettled([
      pages.about ? fetchUrl(pages.about) : Promise.resolve(''),
      pages.contact ? fetchUrl(pages.contact) : Promise.resolve(''),
      pages.services ? fetchUrl(pages.services) : Promise.resolve(''),
    ]);

    const aboutContent = aboutHtml.status === 'fulfilled' ? aboutHtml.value : '';
    const contactContent = contactHtml.status === 'fulfilled' ? contactHtml.value : '';
    const servicesContent = servicesHtml.status === 'fulfilled' ? servicesHtml.value : '';

    // Phase 3: Extract clean text from all pages
    console.log('📝 Extracting content...');
    const homeText = extractCleanText(homepageHtml);
    const aboutText = extractCleanText(aboutContent);
    const contactText = extractCleanText(contactContent);
    const servicesText = extractCleanText(servicesContent);

    // Phase 4: Create comprehensive extraction prompt
    const extractionPrompt = `You are an expert business data extraction specialist. Analyze the website content below and extract ALL business information with maximum accuracy.

Company Name: ${companyName}
Website: ${website}

===== HOMEPAGE CONTENT =====
${homeText}

===== ABOUT PAGE CONTENT =====
${aboutText || 'Not available'}

===== CONTACT PAGE CONTENT =====
${contactText || 'Not available'}

===== SERVICES PAGE CONTENT =====
${servicesText || 'Not available'}

YOUR TASK: Extract every piece of business information you can find. Look carefully through ALL the content above.

CRITICAL INSTRUCTIONS:
- Find phone numbers in ANY format (dashes, dots, parentheses, spaces, with/without country code)
- Find email addresses (look for @ symbols and common domains)
- Find physical addresses (look for street numbers, city, state, ZIP)
- Extract business hours even if formatted oddly
- Find service areas or locations served
- Extract all services/products offered
- Find social media links (look for facebook.com, instagram.com, linkedin.com, twitter.com, youtube.com, tiktok.com)
- Extract the full about text
- Find licensing or certification numbers
- Note the year founded or years in business

Return ONLY valid JSON in this exact structure (no markdown, no explanation):

{
  "officialName": "Full legal business name",
  "category": "Industry or business type",
  "founded": "Year or 'Est. YYYY'",
  "licenses": "Any license/certification numbers found",
  "businessHours": "Operating hours in any format found",
  "mainPhone": "Primary phone number",
  "emails": ["All email addresses found"],
  "physicalAddress": "Complete street address with city, state, ZIP",
  "serviceAreas": ["All areas/cities served"],
  "shortBlurb": "1-2 sentence company description",
  "fullAbout": "Complete about/story text",
  "missionStatement": "Mission, tagline, or slogan",
  "services": [
    {"name": "Service name", "description": "Brief description", "price": "Price if mentioned"}
  ],
  "logoUrl": "URL to logo image",
  "heroImageUrl": "URL to main hero/banner image",
  "galleryImages": ["URLs to gallery images"],
  "videoLinks": ["YouTube or Vimeo URLs"],
  "socialProfiles": {
    "facebook": "URL",
    "instagram": "URL", 
    "linkedin": "URL",
    "twitter": "URL",
    "youtube": "URL",
    "tiktok": "URL"
  },
  "metaTitle": "Page title",
  "metaDescription": "Meta description",
  "h1Tag": "Main heading text",
  "canonicalUrl": "Canonical URL",
  "ogImage": "Open Graph image URL",
  "schemaDetected": true or false,
  "schemaType": "LocalBusiness, Organization, etc.",
  "platform": "WordPress, Webflow, Wix, Squarespace, etc.",
  "sslEnabled": true or false,
  "notes": "Any other important observations"
}

Be thorough. Extract everything you find. Use null for fields where data cannot be found.`;

    // Phase 5: Run both AIs in parallel
    console.log('🤖 Running dual AI extraction...');
    
    const [claudeResult, openaiResult] = await Promise.allSettled([
      // Claude extraction
      anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ 
          role: 'user', 
          content: extractionPrompt 
        }],
      }),
      
      // OpenAI extraction
      openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert at extracting structured business data from website content. Always return valid JSON.' 
          },
          { 
            role: 'user', 
            content: extractionPrompt 
          },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    ]);

    // Parse Claude results
    let claudeData = null;
    if (claudeResult.status === 'fulfilled') {
      try {
        const content = claudeResult.value.content[0];
        if (content.type === 'text') {
          const cleaned = content.text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
          claudeData = JSON.parse(cleaned);
          console.log('✅ Claude extraction successful');
        }
      } catch (e: any) {
        console.error('❌ Claude parsing failed:', e.message);
      }
    } else {
      console.error('❌ Claude request failed:', claudeResult.reason);
    }

    // Parse OpenAI results
    let openaiData = null;
    if (openaiResult.status === 'fulfilled') {
      try {
        const text = openaiResult.value.choices[0]?.message?.content || '{}';
        openaiData = JSON.parse(text);
        console.log('✅ OpenAI extraction successful');
      } catch (e: any) {
        console.error('❌ OpenAI parsing failed:', e.message);
      }
    } else {
      console.error('❌ OpenAI request failed:', openaiResult.reason);
    }

    // Check if at least one succeeded
    if (!claudeData && !openaiData) {
      throw new Error('Both AI extractions failed. Please check API keys and try again.');
    }

    // If only one succeeded, use that
    if (!claudeData && openaiData) {
      console.log('⚠️ Using OpenAI data only');
      return NextResponse.json({
        success: true,
        data: openaiData,
        metadata: {
          confidence: {},
          overallConfidence: 50,
          claudeSuccess: false,
          openaiSuccess: true,
          singleSource: true,
        },
      });
    }

    if (claudeData && !openaiData) {
      console.log('⚠️ Using Claude data only');
      return NextResponse.json({
        success: true,
        data: claudeData,
        metadata: {
          confidence: {},
          overallConfidence: 50,
          claudeSuccess: true,
          openaiSuccess: false,
          singleSource: true,
        },
      });
    }

    // Both succeeded - merge with consensus
    console.log('🔄 Merging results with consensus algorithm...');
    const { merged, confidence } = consensusMerge(claudeData, openaiData);

    // Calculate confidence score
    const confidenceValues = Object.values(confidence);
    const highCount = confidenceValues.filter(c => c === 'high').length;
    const mediumCount = confidenceValues.filter(c => c === 'medium').length;
    const lowCount = confidenceValues.filter(c => c === 'low').length;
    const totalFields = highCount + mediumCount + lowCount;
    
    const overallConfidence = totalFields > 0 
      ? Math.round(((highCount * 100 + mediumCount * 65 + lowCount * 30) / totalFields))
      : 0;

    console.log(`✅ Enrichment complete! Confidence: ${overallConfidence}%`);
    console.log(`   High: ${highCount} | Medium: ${mediumCount} | Low: ${lowCount}`);

    return NextResponse.json({
      success: true,
      data: merged,
      metadata: {
        confidence: confidence,
        overallConfidence: overallConfidence,
        claudeSuccess: true,
        openaiSuccess: true,
        highConfidenceFields: highCount,
        mediumConfidenceFields: mediumCount,
        lowConfidenceFields: lowCount,
        totalFields: totalFields,
        pagesFound: {
          about: !!aboutContent,
          contact: !!contactContent,
          services: !!servicesContent,
        },
      },
    });

  } catch (error: any) {
    console.error('❌ Enrichment failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Enrichment failed',
      },
      { status: 500 }
    );
  }
}