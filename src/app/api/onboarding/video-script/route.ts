import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// POST /api/onboarding/video-script - Generate HeyGen video script
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId, regenerate } = await req.json();

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get intake data (Step 2 data)
    const { data: intake } = await supabase
      .from('intakes')
      .select('*')
      .eq('companyId', companyId)
      .single();

    // Generate video script using Claude
    const script = await generateHeyGenScript(company, intake);

    // Save script to companies table
    const { error: updateError } = await supabase
      .from('companies')
      .update({ video_script: script })
      .eq('id', companyId);

    if (updateError) {
      console.error('Error saving script:', updateError);
      return NextResponse.json({ error: 'Failed to save script' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: regenerate ? 'Script regenerated successfully' : 'Script generated successfully',
      script
    });
  } catch (error) {
    console.error('Video script error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Script generation failed' },
      { status: 500 }
    );
  }
}

async function generateHeyGenScript(company: any, intake: any) {
  // Build the prompt with company/intake data
  const businessName = company.name || intake?.displayName || intake?.legalName || 'the business';
  const industry = intake?.industryCategory || 'business';
  const description = intake?.shortDescription || company.about || intake?.primaryFocus || '';
  const city = company.city || intake?.officeAddress?.split(',')[1]?.trim() || '';
  const state = company.state || '';
  const location = city && state ? `${city}, ${state}` : city || state || '';

  const prompt = `# HEYGEN SCRIPT GENERATOR - CRM INTEGRATED

Generate a 4-scene welcome video script using the business data provided.

## BUSINESS DATA

**Business Name:** ${businessName}
**Industry/Category:** ${industry}
**Description:** ${description}
**Location:** ${location}

## CORE REQUIREMENTS

**Tone:** Natural, conversational, warm—like welcoming a friend. Not corporate, salesy, or robotic. They already signed up.

**Audiences (write for all simultaneously):**
1. Business owner (new customer)
2. Their potential customers
3. Potential EYESAI customers watching
4. General channel viewers

**Key Rules:**
- If company name isn't standard English, use descriptive terms instead
- Always write "EYESAI" exactly like that for proper HeyGen pronunciation
- Use contractions naturally (we're, you're, here's, that's)

---

## TTS SAFETY RULES (CRITICAL)

Apply these EVERY time you insert business names or terms:

| Type | Rule | Example |
|------|------|---------|
| Acronyms | Add spaces | USA → "U S A", LLC → "L L C", BBQ → "B B Q" |
| Numbers | Spell out | 123 → "one two three", 24/7 → "twenty four seven", 1st → "First" |
| Symbols | Convert | & → "and", + → "and", @ → "at" |
| URLs | Never include | Just say business name, no ".com" |
| Possessives | Keep as-is | "Joe's Pizza" stays "Joe's Pizza" |
| Foreign names | Phonetic spelling | inatome → "in uh toe me" |

**Standard terms (use exactly as shown):**
- EYESAI (always this exact format)
- A I platforms / A I search
- Chat G P T

---

## 4-SCENE STRUCTURE

### SCENE 1: WELCOME (~14 sec)
**Visual:** Avatar from EYESAI website on laptop

\`\`\`
[TTS-Clean Business Name] - welcome to EYESAI! [Compliment based on industry/description]. We're really excited to have you in the network, and we're sharing the news right now.
\`\`\`

**Must include:** Business name (TTS-cleaned), welcome, natural compliment, excitement, mention sharing

---

### SCENE 2: PROFILE REVEAL (~23 sec)
**Visual:** Avatar + business profile screenshot

\`\`\`
So here's your EYESAI profile - it's live right now. This is where people find your business, read your reviews, and learn what you're all about. Every month we'll create fresh content - blogs about what you do, videos showcasing your [services/story/work based on business type], social posts on Facebook and X. All designed to get you found on Google, Chat G P T, and A I search.
\`\`\`

**Content language by business type:**
- Services (plumbers, salons, contractors, medical): "blogs highlighting your services"
- Products/Retail (restaurants, stores, cafes): "content about what you offer"
- General/Hybrid (agencies, nonprofits): "content highlighting your work"

---

### SCENE 3: NETWORK GROWTH (~21 sec)
**Visual:** Avatar + "Stronger together with EYESAI" graphics

\`\`\`
Here's what makes this really powerful - we're posting this welcome video and all your content on our channels. YouTube, Instagram, Facebook, X. As our network grows, you grow right along with it. More people seeing your business, more customers finding you. That's the whole idea.
\`\`\`

---

### SCENE 4: CLOSING & CTA (~16 sec)
**Visual:** Avatar left, CTA graphics right

\`\`\`
Best part? You don't have to do anything. We handle the content, the posting, the optimization - all of it. Your profile link is below. Welcome to EYESAI, [TTS-Clean Business Name]. New content every month, completely automated. And hey, if you're a business owner watching this - this could be you next. Let's get you discovered.
\`\`\`

---

## COMPLIMENT GENERATION

Create ONE natural sentence (12-20 words) based on the business industry/description. Must be:
- Genuine, not corporate
- TTS-safe
- No specific claims that could be false

**By industry:**
- Food/Restaurant: "They make quality food and really care about their customers."
- Dumpster/Waste: "They're known for showing up on time and keeping things simple."
- Auto/Mechanic: "They're honest, reliable, and know their stuff."
- Beauty/Salon: "They're creative, professional, and make every client feel special."
- Medical/Dental: "They're focused on patient care and making people feel comfortable."
- Legal: "They bring real expertise and genuine care to every client."
- Construction/Contractor: "They're known for quality work and getting the job done right."
- Retail/Store: "They're passionate about what they do and treat every customer well."

**Good words:** great, quality, reliable, honest, genuine, solid, passionate, skilled

**Never mention:** specific products/prices, "affordable," awards, "family-owned," locations, numbers, superlatives

---

## OUTPUT FORMAT

Return ONLY the 4 scenes in this exact format:

**Scene 1**

[Script text]

**Scene 2**

[Script text]

**Scene 3**

[Script text]

**Scene 4**

[Script text]

---

## FINAL CHECKLIST

✅ Business name cleaned for TTS
✅ EYESAI spelled correctly throughout
✅ All "A I" and "Chat G P T" properly spaced
✅ Compliment matches industry
✅ No URLs in script
✅ Conversational tone`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const scriptText = message.content[0].type === 'text' ? message.content[0].text : '';

  // Parse the response to extract the 4 scenes
  const scenes = parseScriptScenes(scriptText);

  return scenes;
}

function parseScriptScenes(scriptText: string) {
  // Extract scenes using regex patterns
  const scene1Match = scriptText.match(/\*\*Scene 1\*\*\s*\n\s*\n([\s\S]*?)(?=\n\s*\n\*\*Scene 2\*\*|$)/i);
  const scene2Match = scriptText.match(/\*\*Scene 2\*\*\s*\n\s*\n([\s\S]*?)(?=\n\s*\n\*\*Scene 3\*\*|$)/i);
  const scene3Match = scriptText.match(/\*\*Scene 3\*\*\s*\n\s*\n([\s\S]*?)(?=\n\s*\n\*\*Scene 4\*\*|$)/i);
  const scene4Match = scriptText.match(/\*\*Scene 4\*\*\s*\n\s*\n([\s\S]*?)(?=\n\s*\n---|$)/i);

  return {
    scene1: scene1Match?.[1]?.trim() || '',
    scene2: scene2Match?.[1]?.trim() || '',
    scene3: scene3Match?.[1]?.trim() || '',
    scene4: scene4Match?.[1]?.trim() || '',
  };
}
