import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { companyName, website, currentData } = await request.json();

    console.log('Update Profile API called for:', companyName);

    // CRITICAL: Remove large binary data that doesn't need verification
    const dataForVerification = { ...currentData };
    delete dataForVerification.logoUrl;
    delete dataForVerification.galleryImages;
    delete dataForVerification.videoLinks;
    delete dataForVerification.heroImageUrl;

    const systemPrompt = `You are a business data verification assistant. Verify business information by searching the web and comparing it to current data.

For each field, determine:
1. Is the current value still accurate?
2. If not, what is the correct value?
3. What sources did you check?

Return results in this EXACT JSON format:
{
  "verificationResults": [
    {
      "field": "mainPhone",
      "fieldLabel": "Main Phone",
      "currentValue": "888-555-5555",
      "verifiedValue": "888-555-6666",
      "changed": true,
      "sources": ["company website"]
    }
  ]
}`;

    const userPrompt = `Verify all business information for: ${companyName} (${website})

CURRENT DATA:
${JSON.stringify(dataForVerification, null, 2)}

STEPS:
1. Search for "${companyName}" business information
2. Fetch the company website: ${website}
3. Verify each field against what you find
4. Return verification results in JSON format

Check these fields:
- officialName, mainPhone, emails, physicalAddress, businessHours
- category, founded, licenses, serviceAreas
- shortBlurb, fullAbout, missionStatement
- socialProfiles (Facebook, Instagram, LinkedIn, Twitter, YouTube, TikTok)
- services

Return ONLY the JSON object with verificationResults.`;

    console.log('Starting verification with Claude...');

    // Initial request
    let messages: any[] = [
      {
        role: 'user',
        content: userPrompt,
      },
    ];

    let continueLoop = true;
    let iterationCount = 0;
    const maxIterations = 10;

    while (continueLoop && iterationCount < maxIterations) {
      iterationCount++;
      console.log(`Iteration ${iterationCount}...`);

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16000,
        system: systemPrompt,
        messages: messages,
        tools: [
          {
            name: 'web_search',
            description: 'Search the web for information',
            input_schema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'web_fetch',
            description: 'Fetch the contents of a web page',
            input_schema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to fetch',
                },
              },
              required: ['url'],
            },
          },
        ],
      });

      console.log('Response stop_reason:', response.stop_reason);

      // Check if Claude wants to use tools
      if (response.stop_reason === 'tool_use') {
        console.log('Claude is using tools...');

        // Add Claude's response to messages
        messages.push({
          role: 'assistant',
          content: response.content,
        });

        // Process tool uses
        const toolResults: any[] = [];

        for (const block of response.content) {
          if (block.type === 'tool_use') {
            console.log(`Executing tool: ${block.name}`);

            if (block.name === 'web_search') {
              // Simulate web search (in production, use real search API)
              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: JSON.stringify({
                  results: [
                    { title: 'Company Website', snippet: 'Business information available on website' },
                  ],
                }),
              });
            } else if (block.name === 'web_fetch') {
              // Simulate web fetch (in production, use real fetch)
              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: 'Website content fetched successfully',
              });
            }
          }
        }

        // Add tool results to messages
        messages.push({
          role: 'user',
          content: toolResults,
        });
      } else if (response.stop_reason === 'end_turn') {
        // Claude finished, try to extract JSON
        console.log('Claude finished, extracting JSON...');

        const textBlock = response.content.find((block: any) => block.type === 'text');

        if (textBlock) {
          const text = textBlock.text;
          console.log('Response text:', text.substring(0, 500));

          // Try to find JSON in the response
          const jsonMatch = text.match(/\{[\s\S]*"verificationResults"[\s\S]*\}/);

          if (jsonMatch) {
            try {
              const verificationData = JSON.parse(jsonMatch[0]);
              console.log('Verification complete:', verificationData.verificationResults?.length || 0, 'fields checked');

              return NextResponse.json({
                success: true,
                data: verificationData,
                metadata: {
                  timestamp: new Date().toISOString(),
                  fieldsChecked: verificationData.verificationResults?.length || 0,
                },
              });
            } catch (parseError) {
              console.error('JSON parse error:', parseError);
              throw new Error('Invalid JSON format in response');
            }
          } else {
            // No JSON found, but maybe Claude needs more guidance
            console.log('No JSON found, asking Claude to return JSON...');
            
            messages.push({
              role: 'assistant',
              content: response.content,
            });

            messages.push({
              role: 'user',
              content: 'Please return the verification results in the JSON format specified. Return ONLY the JSON object with verificationResults array.',
            });

            continue;
          }
        } else {
          throw new Error('No text content in response');
        }
      } else {
        console.log('Unexpected stop_reason:', response.stop_reason);
        continueLoop = false;
      }
    }

    if (iterationCount >= maxIterations) {
      throw new Error('Maximum iterations reached without getting JSON response');
    }

    throw new Error('Failed to get verification results');
  } catch (error: any) {
    console.error('Update profile error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update profile',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}