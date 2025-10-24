import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { company, intake, context } = await request.json();

    const industryCategory = intake?.industryCategory || 'local business';
    const services = intake?.services?.length > 0 
      ? intake.services.join(', ') 
      : 'various local services';
    const primaryFocus = intake?.primaryFocus || 'customer satisfaction';

    // Build prompt based on whether context is provided
    let prompt = `Generate 5 blog title suggestions for ${company.name} in ${company.city}, ${company.state}.

Industry: ${industryCategory}
Services: ${services}
Focus: ${primaryFocus}`;

    // Add context if provided
    if (context && context.trim()) {
      prompt += `\n\nADDITIONAL CONTEXT FROM USER:\n${context}\n\nUse this context to create more specific, targeted titles.`;
    }

    prompt += `\n\nFor each title, create:
1. H1: Compelling question/statement (8-12 words) including "${company.city}"
2. H2: Supporting subtitle (10-15 words) including "${company.name}"
3. Keywords: 4-5 geo-targeted keywords with "${company.city}"

Requirements:
- Address common customer pain points
- Be locally relevant and geo-optimized
- Include year (2025) when fresh/timely
- Be compelling and click-worthy
- Natural use of location (not forced)

Return ONLY a JSON array:

[
  {
    "h1": "Title here",
    "h2": "Subtitle here",
    "keywords": ["kw1", "kw2", "kw3", "kw4", "kw5"]
  }
]

Return ONLY the JSON array, no markdown, no explanation.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].type === 'text' 
      ? response.content[0].text.trim()
      : '';

    console.log('Claude response:', content);

    // Try multiple extraction methods
    let suggestions;
    
    // Method 1: Direct JSON parse
    try {
      suggestions = JSON.parse(content);
    } catch {
      // Method 2: Extract from markdown code block
      const codeBlockMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (codeBlockMatch) {
        suggestions = JSON.parse(codeBlockMatch[1]);
      } else {
        // Method 3: Find any array in response
        const arrayMatch = content.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          suggestions = JSON.parse(arrayMatch[0]);
        } else {
          throw new Error('No valid JSON found in response');
        }
      }
    }

    // Validate
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error('Invalid suggestions format');
    }

    return NextResponse.json({ suggestions });

  } catch (error: any) {
    console.error('Title generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate titles' },
      { status: 500 }
    );
  }
}