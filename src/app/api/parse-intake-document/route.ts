import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { documentText } = await request.json();

    console.log('Parsing intake document...');

    const prompt = `You are a data extraction assistant. Extract ALL information from this business intake document and return it as structured JSON.

DOCUMENT TEXT:
${documentText}

Extract and return JSON with these EXACT field names. Copy text EXACTLY as written - do NOT modify, shorten, or summarize:

{
  "legalCanonicalName": "",
  "alsoKnownAs": "",
  "industryCategoryBadges": "",
  "yearEstablished": "",
  "ownershipHeritage": "",
  "businessStatus": "",
  "taglineSlogan": "",
  "shortDescription": "",
  "verificationTier": "",
  "website": "",
  "mainPhone": "",
  "physicalAddress": "",
  "onlineOrdering": "",
  "emails": "",
  "canonicalDomain": "",
  "latitudeLongitude": "",
  "geoSource": "",
  "localFocus": "",
  "primaryNearbyTowns": "",
  "businessHours": "",
  "responseTime": "",
  "servicesOffered": "",
  "verifiedFiveStarTotal": "",
  "googleReviewsTotal": "",
  "reviewLinks": "",
  "yelpInfo": "",
  "facebookInfo": "",
  "tripadvisorInfo": "",
  "directProfiles": "",
  "quickFacts": "",
  "primarySeoKeywords": "",
  "verifiedFallbackBadges": "",
  "instagramUrl": "",
  "facebookUrl": "",
  "galleryUrl": "",
  "recipesUrl": "",
  "visualAssets": "",
  "faqs": "",
  "changeLogConfidenceGaps": "",
  "comparativeValueTable": "",
  "metaTitle": "",
  "metaDescription": "",
  "jsonLdSchema": "",
  "internalLinks": "",
  "externalCitations": "",
  "schemaElementsIncluded": "",
  "aiDiscoveryTier": "",
  "lastUpdatedDate": ""
}

CRITICAL RULES:
- Extract text EXACTLY as written in the document
- Do NOT modify, shorten, or summarize any content
- Do NOT add your own interpretations
- Preserve all formatting, bullet points (use • character), and line breaks (use \\n)
- If a field has multiple lines, preserve them exactly with \\n between lines
- For lists with bullets, keep the • character
- Return ONLY the JSON object, no markdown, no code blocks, no other text
- If a field is not found in the document, use empty string ""

Example for servicesOffered - preserve exact formatting:
"Italian Deli & Marketplace\\n\\t•\\tHeroes, Sandwiches & Wraps — Cold cuts, Italian combos, chicken cutlet builds. Duration: 5–15 min typical. Notes: Custom builds available.\\n\\t•\\tHot Prepared Foods — Chicken parm/francaise..."`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    console.log('Claude response received');

    const textContent = message.content.find((block: any) => block.type === 'text');
    
    if (!textContent) {
      throw new Error('No text content in response');
    }

    const text = textContent.text;
    
    // Try to parse JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    console.log('Document parsed successfully');

    return NextResponse.json({
      success: true,
      data: extractedData,
    });
  } catch (error: any) {
    console.error('Parse document error:', error);
    
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