import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { document } = await request.json();

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'No document provided' },
        { status: 400 }
      );
    }

    const prompt = `You are a data extraction AI. Extract ALL information from this intake document and return it as a JSON object.

CRITICAL RULES:
1. Extract EVERY piece of information you find
2. Use the EXACT field names I provide below
3. If a field is not in the document, use null (not "N/A" or empty string)
4. For arrays, extract ALL items mentioned
5. Be thorough - don't skip anything

Extract these fields:

**Basic Info:**
- legalName (string)
- displayName (string) 
- tagline (string)
- industryCategory (string)
- yearEstablished (string)
- ownerPrincipal (string)
- ownershipType (string)
- verificationTier (string: "Basic" | "Verified" | "Premium")
- businessStatus (string)
- shortDescription (string)

**Contact:**
- officePhone (string)
- alternatePhone (string)
- contactEmail (string)
- officeAddress (string)
- latitude (number)
- longitude (number)

**Service Area:**
- primaryFocus (string)
- highlightedTowns (array of strings)
- serviceRadius (string)

**Hours:**
- businessHours (object with days as keys)
- responseTime (string)
- emergencyAvailable (boolean)

**Services:**
- services (array of objects with: name, category, priceRange, timeline, description, inclusions, notes)

**Reviews:**
- verifiedFiveStarTotal (number)
- googleReviewsTotal (number)
- reviewLinks (object with: google, yelp, facebook, bbb)
- reviewNotes (string)

**Metrics:**
- yearsInBusiness (number)
- licensesCertifications (array of strings)
- warrantyInfo (string)
- projectVolume (string)
- autoKeywords (array of strings)
- badges (array of strings)

**Social:**
- instagramUrl (string)
- facebookUrl (string)
- youtubeUrl (string)
- linkedinUrl (string)
- tiktokUrl (string)
- galleryLinks (array of strings)
- pressLinks (array of strings)

**Media:**
- beforeAfterImages (array of strings)
- projectGallery (array of strings)
- embeddedVideos (array of strings)

**FAQs:**
- faqs (array of objects with: question, answer)

**Meta:**
- gbpVerificationStatus (string)
- dataGaps (string)
- metaTitle (string)
- metaDescription (string)
- structuredData (object - the JSON-LD schema)
- schemaElements (array of strings)
- aiDiscoveryTier (string)

DOCUMENT TO PARSE:
${document}

Return ONLY valid JSON with no markdown, no explanation, just the JSON object.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    let parsedData;
    try {
      // Remove markdown code blocks if present
      let jsonText = content.text.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      parsedData = JSON.parse(jsonText);
    } catch (e) {
      console.error('Failed to parse Claude response:', content.text);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Count fields that were extracted
    const fieldsExtracted = Object.keys(parsedData).filter(
      key => parsedData[key] !== null && parsedData[key] !== undefined && parsedData[key] !== ''
    ).length;

    return NextResponse.json({
      success: true,
      data: parsedData,
      fieldsExtracted,
    });
  } catch (error: any) {
    console.error('Parse intake error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to parse document' },
      { status: 500 }
    );
  }
}