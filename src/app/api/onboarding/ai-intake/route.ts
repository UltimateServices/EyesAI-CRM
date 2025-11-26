import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// POST /api/onboarding/ai-intake - Run AI intake for a company
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

    // Run Claude AI intake
    const intakeData = await runClaudeIntake(company);

    // Update company with intake data
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        tagline: intakeData.tagline,
        description: intakeData.description,
        services: intakeData.services,
        city: intakeData.city || company.city,
        state: intakeData.state || company.state,
        phone: intakeData.phone || company.phone,
        email: intakeData.email || company.email,
      })
      .eq('id', companyId);

    if (updateError) {
      console.error('Error updating company with intake data:', updateError);
      return NextResponse.json({ error: 'Failed to save intake data' }, { status: 500 });
    }

    // Mark step 2 as complete
    await supabase
      .from('onboarding_steps')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        completed_by: user.id,
        metadata: { intake_data: intakeData }
      })
      .eq('company_id', companyId)
      .eq('step_number', 2);

    return NextResponse.json({
      success: true,
      message: 'AI intake completed successfully',
      data: intakeData
    });
  } catch (error) {
    console.error('AI intake error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI intake failed' },
      { status: 500 }
    );
  }
}

async function runClaudeIntake(company: any) {
  const prompt = `You are an AI assistant helping to perform business intake for a new client.

Company Information:
- Name: ${company.name}
- Website: ${company.website}
${company.city ? `- City: ${company.city}` : ''}
${company.state ? `- State: ${company.state}` : ''}

Your task is to visit the company's website and extract the following information:
1. A catchy tagline (one short sentence that captures what they do)
2. A detailed description (2-3 paragraphs about the business)
3. Services they offer (list of main services)
4. Contact information (phone, email if not already provided)
5. Location details (city, state if not already provided)

Please research the company's website and provide the information in JSON format:
{
  "tagline": "...",
  "description": "...",
  "services": ["service1", "service2", ...],
  "phone": "...",
  "email": "...",
  "city": "...",
  "state": "..."
}

If you cannot find certain information, use null for that field.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  // Extract JSON from response
  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  // Try to parse JSON from the response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not extract JSON from AI response');
  }

  const intakeData = JSON.parse(jsonMatch[0]);
  return intakeData;
}
