import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { company, intake } = await request.json();

    const prompt = `You are an expert local SEO content strategist. Generate 5 blog title suggestions for ${company.name}, a business in ${company.city}, ${company.state}.

Business Details:
- Industry: ${intake.industryCategory || 'local business'}
- Services: ${intake.services?.join(', ') || 'various services'}
- Focus: ${intake.primaryFocus || 'customer service'}

Requirements for EACH title:
1. H1: A compelling question or statement (8-12 words) that includes "${company.city}" naturally
2. H2: A supporting subtitle (10-15 words) that includes "${company.name}" 
3. Keywords: Exactly 4-5 geo-targeted keywords that include "${company.city}" or nearby areas

The titles should:
- Address common customer pain points or questions
- Be locally relevant and geo-optimized
- Include year (2025) when appropriate for freshness
- Be compelling and click-worthy
- Include the city name naturally (not forced)

Format your response as a JSON array:
[
  {
    "h1": "Question or statement here",
    "h2": "Supporting subtitle here", 
    "keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"]
  }
]

Generate exactly 5 diverse title suggestions.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse title suggestions');
    }

    const suggestions = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ suggestions });

  } catch (error: any) {
    console.error('Title generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate titles' },
      { status: 500 }
    );
  }
}