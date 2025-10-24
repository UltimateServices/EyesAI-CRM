import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
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

    // Step 1: Generate Quick Answer (50-75 words)
    const quickAnswerPrompt = `Write a 50-75 word direct answer for: "${topic.h1}"

Context: ${company.name} in ${company.city}, ${company.state}

Write as if answering a voice search. Be concise and specific. Include ${company.city} naturally.

Return ONLY the answer text, no extra formatting.`;

    const quickAnswerResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      messages: [{ role: 'user', content: quickAnswerPrompt }]
    });

    const quickAnswer = quickAnswerResponse.content[0].type === 'text'
      ? quickAnswerResponse.content[0].text.trim()
      : '';

    // Step 2: Generate 5 Key Takeaways
    const takeawaysPrompt = `Generate exactly 5 key takeaways for: "${topic.h1}" for ${company.name} in ${company.city}.

Requirements:
- Each is one concise sentence
- Include ${company.name} or ${company.city} in 2-3 of them
- Focus on actionable insights

Return as JSON array: ["takeaway 1", "takeaway 2", "takeaway 3", "takeaway 4", "takeaway 5"]

Return ONLY the JSON array.`;

    const takeawaysResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: takeawaysPrompt }]
    });

    const takeawaysText = takeawaysResponse.content[0].type === 'text'
      ? takeawaysResponse.content[0].text.trim()
      : '[]';
    
    let keyTakeaways = [];
    try {
      const match = takeawaysText.match(/\[[\s\S]*\]/);
      keyTakeaways = match ? JSON.parse(match[0]) : [];
    } catch {
      keyTakeaways = [];
    }

    // Step 3: Generate Main Content (1500-1800 words with 5-6 H3 sections)
    const contentPrompt = `Write a 1500-1800 word blog post for ${company.name} in ${company.city}, ${company.state}.

H1: ${topic.h1}
H2: ${topic.h2}

STRUCTURE (CRITICAL):
1. Introduction paragraph (150 words)
2. EXACTLY 5-6 H3 sections (each 250-300 words)
3. Conclusion paragraph (150 words) with call-to-action

CONTENT REQUIREMENTS:
- Mention ${company.name} exactly 4-5 times naturally throughout
- Mention ${company.city} exactly 6-8 times naturally throughout
- Use conversational, helpful tone (second person "you" when appropriate)
- Short paragraphs (3-4 sentences max)
- Include 3-4 bullet lists using <ul><li> tags
- Use <strong> tags on 8-10 important keywords
- Target keywords: ${keywords.join(', ')}

CUSTOMER REVIEWS TO INTEGRATE:
${selectedReviews.map((r: any, i: number) => `
Review ${i + 1}: "${r.text}" - ${r.author}
`).join('\n')}

Integrate these reviews naturally as <blockquote> tags with attribution in relevant H3 sections.

IMAGES TO INSERT:
Image 1: ${selectedImages[0]?.url || 'placeholder'}
Alt: ${selectedImages[0]?.altText || 'Image 1'}

Image 2: ${selectedImages[1]?.url || 'placeholder'}
Alt: ${selectedImages[1]?.altText || 'Image 2'}

Image 3: ${selectedImages[2]?.url || 'placeholder'}
Alt: ${selectedImages[2]?.altText || 'Image 3'}

INSERT IMAGES using this EXACT format in relevant H3 sections (after the section where they fit best):

<div class="my-8">
  <img src="${selectedImages[0]?.url}" alt="${selectedImages[0]?.altText}" class="w-full rounded-lg shadow-lg" />
</div>

Spread the 3 images across 3 different H3 sections naturally.

HTML TAGS TO USE:
- <p> for paragraphs
- <h3> for section headers (5-6 total)
- <strong> for emphasis
- <ul><li> for bullet lists
- <blockquote class="border-l-4 border-blue-500 pl-4 italic my-4"> for reviews
- <div class="my-8"><img> for images

DO NOT include H1, H2, or any wrapper divs. Start with introduction <p> tag.

Return ONLY the HTML content.`;

    const contentResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 5000,
      messages: [{ role: 'user', content: contentPrompt }]
    });

    const content = contentResponse.content[0].type === 'text'
      ? contentResponse.content[0].text.trim()
      : '';

    // Step 4: Generate 5-7 FAQs
    const faqPrompt = `Generate 5-7 frequently asked questions and answers for: "${topic.h1}"

Context: ${company.name} in ${company.city}, ${company.state}
Keywords: ${keywords.join(', ')}

Requirements:
- Questions should be common customer queries
- Answers should be 2-3 sentences
- Include ${company.name} or ${company.city} naturally in 3-4 answers
- Cover different aspects of the topic

Return as JSON array:
[
  {"q": "Question 1?", "a": "Answer 1"},
  {"q": "Question 2?", "a": "Answer 2"},
  ...
]

Return ONLY the JSON array.`;

    const faqResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: faqPrompt }]
    });

    const faqText = faqResponse.content[0].type === 'text'
      ? faqResponse.content[0].text.trim()
      : '[]';
    
    let faqs = [];
    try {
      const match = faqText.match(/\[[\s\S]*\]/);
      faqs = match ? JSON.parse(match[0]) : [];
    } catch {
      faqs = [];
    }

    // Step 5: Generate Meta Description (150-155 characters)
    const metaPrompt = `Write a 150-155 character meta description for: "${topic.h1}"

Include: ${company.name}, ${company.city}, and main benefit.
Make it compelling for search results.

Return ONLY the meta description text.`;

    const metaResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{ role: 'user', content: metaPrompt }]
    });

    const metaDescription = metaResponse.content[0].type === 'text'
      ? metaResponse.content[0].text.trim()
      : '';

    // Return complete blog
    return NextResponse.json({
      quickAnswer,
      keyTakeaways,
      content,
      faqs,
      metaDescription,
    });

  } catch (error: any) {
    console.error('Blog generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate blog' },
      { status: 500 }
    );
  }
}