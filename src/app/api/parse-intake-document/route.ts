import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { document, companyName } = await request.json();

    if (!document || !document.trim()) {
      return NextResponse.json(
        { success: false, error: 'No document provided' },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    console.log('📄 Parsing intake document for:', companyName);
    console.log('Document length:', document.length, 'characters');

    const prompt = `You are an expert at extracting structured business data from intake documents.

Extract ALL available information from this business intake document and return it as a JSON object with these exact field names:

{
  "legalCanonicalName": "Full legal business name",
  "alsoKnownAs": "DBA, aliases, former names",
  "industryCategoryBadges": "Industry and category tags",
  "yearEstablished": "Year founded",
  "ownershipHeritage": "Family-owned, ownership details",
  "businessStatus": "Current business status",
  "taglineSlogan": "Company tagline or slogan",
  "shortDescription": "Brief business overview (50-80 words)",
  "verificationTier": "Verification level if mentioned",
  "officialName": "Official business name",
  "website": "Website URL",
  "mainPhone": "Primary phone number",
  "physicalAddress": "Full street address",
  "onlineOrdering": "Online ordering info",
  "emails": "Email addresses",
  "canonicalDomain": "Primary domain",
  "latitudeLongitude": "GPS coordinates",
  "geoSource": "Geolocation source",
  "localFocus": "Geographic focus area",
  "primaryNearbyTowns": "Nearby towns/cities served",
  "businessHours": "Operating hours",
  "responseTime": "Typical response time",
  "servicesOffered": "List of all services/products",
  "verifiedFiveStarTotal": "Number of 5-star reviews",
  "googleReviewsTotal": "Total Google reviews",
  "reviewLinks": "All review platform URLs",
  "yelpInfo": "Yelp information",
  "facebookInfo": "Facebook information",
  "tripadvisorInfo": "TripAdvisor information",
  "directProfiles": "Direct profile links",
  "googleMapsLink1": "First Google Maps URL if found",
  "googleMapsLink2": "Second Google Maps URL if found",
  "googleMapsLink3": "Third Google Maps URL if found",
  "quickFacts": "Key facts and differentiators",
  "primarySeoKeywords": "Primary SEO keywords",
  "verifiedFallbackBadges": "Badges and certifications",
  "socialMediaLinks": "All social media links",
  "instagramUrl": "Instagram URL",
  "facebookUrl": "Facebook URL",
  "galleryUrl": "Gallery URL",
  "recipesUrl": "Recipes URL if applicable",
  "visualAssets": "Visual assets description",
  "logoUrl": "Logo URL",
  "faqs": "FAQ content"
}

IMPORTANT RULES:
1. Extract EVERY piece of information you find in the document
2. If a field is not in the document, set it to empty string ""
3. For multi-line content (like services, FAQs, hours), preserve all details
4. Extract all URLs you find (review links, social media, etc.)
5. Return ONLY valid JSON, no additional text
6. Make sure all text is properly escaped for JSON

Here is the intake document:

${document}

Return the extracted data as valid JSON:`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    console.log('🤖 Claude response length:', responseText.length);

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/```\s*$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/```\s*$/, '');
    }

    const extractedData = JSON.parse(jsonText);
    
    // Count how many fields were actually filled
    const filledFields = Object.values(extractedData).filter(v => v && String(v).trim() !== '').length;
    console.log('✅ Extracted', filledFields, 'fields');

    return NextResponse.json({
      success: true,
      data: extractedData,
      fieldsExtracted: filledFields,
    });

  } catch (error: any) {
    console.error('❌ Parse error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to parse document',
        details: error.toString() 
      },
      { status: 500 }
    );
  }
}