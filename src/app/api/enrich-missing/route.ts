import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { companyName, website, existingData, missingFields } = await request.json();

    console.log('🔍 Filling missing fields for:', companyName);
    console.log('🎯 Missing fields:', missingFields);

    const prompt = `You are a business research specialist. The following fields are MISSING from a company's intake data. Your job is to make educated, intelligent guesses based on the company name, website, industry, and existing data.

Company Name: ${companyName}
Website: ${website}

EXISTING DATA:
${JSON.stringify(existingData, null, 2)}

MISSING FIELDS THAT NEED TO BE FILLED:
${missingFields.join(', ')}

Based on:
1. The company name and what it suggests about the business
2. The industry/category already identified
3. Common patterns for this type of business
4. The website domain and structure
5. Geographic indicators in the name or existing data

Provide your best educated guesses for the missing fields. Be realistic and practical.

Return ONLY valid JSON with the missing fields filled in:

{
  ${missingFields.map((field: string) => `"${field}": "your best guess or null"`).join(',\n  ')}
}

GUIDELINES:
- For phone: If you don't know, leave null
- For email: Try common patterns like info@domain.com, contact@domain.com
- For address: If you see a city/state in name or existing data, suggest that area
- For hours: Suggest typical hours for this business type (e.g., "Mon-Fri 8am-5pm" for B2B)
- For services: Suggest common services for this industry
- For social: Try common patterns like facebook.com/companyname

Be helpful but honest - use null if you truly cannot make a reasonable guess.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const cleaned = content.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const filledData = JSON.parse(cleaned);

    console.log('✅ Missing fields filled');

    return NextResponse.json({
      success: true,
      data: filledData,
    });

  } catch (error: any) {
    console.error('❌ Missing field fill error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}