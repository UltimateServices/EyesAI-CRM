import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { 
      company, 
      topic, 
      selectedReviews, 
      selectedImages,
      keywords 
    } = await request.json();

    // Step 1: Generate main content with Claude
    const contentPrompt = `Write a 1000-word blog post for ${company.name}, a business located in ${company.city}, ${company.state}.

Topic: ${topic.h1}
Subtitle: ${topic.h2}

IMPORTANT CONTEXT TO INTEGRATE:
1. Featured Reviews (integrate naturally):
${selectedReviews.map((r: any, i: number) => `   Review ${i + 1}: "${r.text}" - ${r.author}`).join('\n')}

2. Images to Reference (mention these naturally in content):
${selectedImages.map((img: any, i: number) => `   Image ${i + 1}: ${img.altText}`).join('\n')}

REQUIREMENTS:
- Conversational, helpful tone (like talking to a friend)
- Mention ${company.name} 4-5 times naturally throughout
- Mention ${company.city} 6-8 times naturally throughout
- Include 4 H3 subheadings with descriptive titles
- Use short paragraphs (3-4 sentences max)
- Add 3-4 bullet point lists for scannability
- Write in second person ("you") when appropriate
- Use **bold** on 8-10 important keywords naturally
- Include specific examples and details
- Natural transitions between sections
- Integrate the customer reviews organically (don't just drop them in)
- Reference the images contextually where relevant

TARGET KEYWORDS: ${keywords.join(', ')}

Format as HTML with proper tags: <h3>, <p>, <strong>, <ul>, <li>, <blockquote>

Do NOT include H1 or H2 - those are separate.`;

    const contentResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: contentPrompt
      }]
    });

    const content = contentResponse.content[0].type === 'text' 
      ? contentResponse.content[0].text 
      : '';

    // Step 2: Generate FAQs with ChatGPT
    const faqPrompt = `Based on this blog about ${topic.h1} for ${company.name} in ${company.city}, generate 7 frequently asked questions with concise answers.

Include ${company.city} or ${company.name} in 4-5 of the questions naturally.

Format as JSON array:
[
  {"q": "Question here?", "a": "Answer here."},
  ...
]`;

    const faqResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{
        role: 'user',
        content: faqPrompt
      }],
      response_format: { type: 'json_object' }
    });

    const faqsData = JSON.parse(faqResponse.choices[0].message.content || '{"faqs": []}');
    const faqs = faqsData.faqs || [];

    // Step 3: Generate Quick Answer with Claude
    const quickAnswerPrompt = `For the blog topic "${topic.h1}", write a single 1-2 sentence direct answer that would be perfect for voice search and featured snippets. Be concise and specific. Include ${company.city} naturally.`;

    const quickAnswerResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: quickAnswerPrompt
      }]
    });

    const quickAnswer = quickAnswerResponse.content[0].type === 'text'
      ? quickAnswerResponse.content[0].text
      : '';

    // Step 4: Generate Key Takeaways
    const takeawaysPrompt = `From this blog content, extract exactly 5 key takeaways as bullet points. Each should be one line. Include ${company.name} and ${company.city} in 2-3 of them naturally.

Content: ${content.substring(0, 500)}...

Format as JSON array of strings: ["takeaway 1", "takeaway 2", ...]`;

    const takeawaysResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: takeawaysPrompt
      }]
    });

    const takeawaysText = takeawaysResponse.content[0].type === 'text'
      ? takeawaysResponse.content[0].text
      : '[]';
    
    // Extract JSON from response - FIXED REGEX
    const takeawaysMatch = takeawaysText.match(/\[[\s\S]*\]/);
    const keyTakeaways = takeawaysMatch ? JSON.parse(takeawaysMatch[0]) : [];

    // Step 5: Generate Meta Description
    const metaDescription = `${quickAnswer.substring(0, 150)}...`.replace(/\n/g, ' ');

    return NextResponse.json({
      content,
      faqs,
      quickAnswer,
      keyTakeaways,
      metaDescription
    });

  } catch (error: any) {
    console.error('Blog generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate blog' },
      { status: 500 }
    );
  }
}