import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// POST /api/onboarding/video-script - Generate welcome video script
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = await req.json();

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

    // Generate video script using Claude
    const script = await generateVideoScript(company);

    // Store script in step metadata
    await supabase
      .from('onboarding_steps')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        completed_by: user.id,
        metadata: { script }
      })
      .eq('company_id', companyId)
      .eq('step_number', 7);

    return NextResponse.json({
      success: true,
      message: 'Video script generated successfully',
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

async function generateVideoScript(company: any) {
  const prompt = `You are a professional video script writer creating a warm, welcoming video script for a new client.

Company Information:
- Name: ${company.name}
- Tagline: ${company.tagline || 'A trusted local business'}
- Description: ${company.description || 'We provide quality services to our community'}
- Services: ${company.services ? company.services.join(', ') : 'various services'}
- Location: ${company.city}, ${company.state}

Create a 30-45 second welcome video script that:
1. Welcomes them to our platform
2. Highlights their business briefly
3. Mentions their profile is now live
4. Encourages them to log in and explore features
5. Ends with an enthusiastic call to action

The tone should be warm, professional, and exciting. The script should be read by a friendly representative.

Format the response as:
WELCOME VIDEO SCRIPT

[Script content here, formatted with clear paragraphs and natural pauses]

---
ESTIMATED DURATION: [X] seconds`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const script = message.content[0].type === 'text' ? message.content[0].text : '';
  return script;
}
