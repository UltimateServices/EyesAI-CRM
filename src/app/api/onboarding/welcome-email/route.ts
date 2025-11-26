import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// POST /api/onboarding/welcome-email - Send welcome email and move to DISCOVER
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

    // TODO: Actually send email using your email service (SendGrid, Resend, etc.)
    // For now, we'll just simulate it
    const emailSent = await sendWelcomeEmail(company);

    if (!emailSent) {
      throw new Error('Failed to send welcome email');
    }

    // Mark step 9 as complete
    await supabase
      .from('onboarding_steps')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        completed_by: user.id,
        metadata: { email_sent_at: new Date().toISOString() }
      })
      .eq('company_id', companyId)
      .eq('step_number', 9);

    // Move company from NEW to DISCOVER status
    await supabase
      .from('companies')
      .update({ status: 'DISCOVER' })
      .eq('id', companyId);

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent and company moved to DISCOVER status'
    });
  } catch (error) {
    console.error('Welcome email error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send welcome email' },
      { status: 500 }
    );
  }
}

async function sendWelcomeEmail(company: any): Promise<boolean> {
  // TODO: Implement actual email sending
  // For now, just log and return true
  console.log('Sending welcome email to:', company.email || company.name);

  const emailContent = `
    Subject: Welcome to Eyes AI!

    Dear ${company.name},

    Welcome to Eyes AI! We're excited to have you on board.

    Your profile is now live and ready to attract new customers. Here's what you can do next:

    1. Log in to your dashboard: [DASHBOARD_URL]
    2. Review your profile: [PROFILE_URL]
    3. Explore our features and tools
    4. Reach out if you need any assistance

    Thank you for choosing Eyes AI to grow your business!

    Best regards,
    The Eyes AI Team
  `;

  console.log('Email content:', emailContent);

  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return true;
}
