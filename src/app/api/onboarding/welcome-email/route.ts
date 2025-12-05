import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

// Use SERVICE ROLE KEY for creating users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface EmailData {
  ownerName: string;
  businessName: string;
  businessSlug: string;
  clientEmail: string;
  profileUrl: string;
  videoUrl: string;
  packageType: string;
  packagePrice: string;
  loginUrl: string;
  tempPassword: string;
}

// POST /api/onboarding/welcome-email - Send welcome email and move to DISCOVER
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId, emailData } = await req.json();

    if (!companyId || !emailData) {
      return NextResponse.json({ error: 'companyId and emailData are required' }, { status: 400 });
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

    // Create Supabase auth user for the client
    let clientUserId = null;
    try {
      const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: emailData.clientEmail,
        password: emailData.tempPassword,
        email_confirm: true,
        user_metadata: {
          name: emailData.ownerName,
          company_id: companyId,
          company_name: emailData.businessName,
        },
      });

      if (createUserError) {
        console.error('Error creating client user:', createUserError);
        // Continue anyway - we'll send email without login credentials
      } else {
        clientUserId = authData.user.id;
      }
    } catch (err) {
      console.error('Exception creating client user:', err);
      // Continue anyway
    }

    // Send email via Klaviyo
    const emailSent = await sendWelcomeEmail(emailData);

    if (!emailSent) {
      throw new Error('Failed to send welcome email');
    }

    // Update company with client_user_id
    if (clientUserId) {
      await supabase
        .from('companies')
        .update({ client_user_id: clientUserId })
        .eq('id', companyId);
    }

    // Mark step 9 as complete
    await supabase
      .from('onboarding_steps')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        completed_by: user.id,
        metadata: {
          email_sent_at: new Date().toISOString(),
          client_user_created: !!clientUserId,
        }
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
      message: 'Welcome email sent and company moved to DISCOVER status',
      clientUserCreated: !!clientUserId,
    });
  } catch (error) {
    console.error('Welcome email error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send welcome email' },
      { status: 500 }
    );
  }
}

async function sendWelcomeEmail(emailData: EmailData): Promise<boolean> {
  try {
    const KLAVIYO_API_KEY = process.env.KLAVIYO_API_KEY;

    if (!KLAVIYO_API_KEY) {
      console.error('KLAVIYO_API_KEY not found');
      return false;
    }

    const htmlEmail = buildEmailHTML(emailData);

    // Send via Klaviyo API
    const response = await fetch('https://a.klaviyo.com/api/v1/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: KLAVIYO_API_KEY,
        to_email: emailData.clientEmail,
        from_email: 'noreply@eyesai.com',
        from_name: 'EyesAI',
        subject: `Welcome to EyesAI, ${emailData.businessName}! 🎉`,
        html: htmlEmail,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Klaviyo error:', errorText);
      return false;
    }

    console.log('✅ Welcome email sent to:', emailData.clientEmail);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

function buildEmailHTML(data: EmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to EyesAI</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      text-align: center;
      padding: 40px 20px 20px;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #6366f1;
      margin-bottom: 12px;
    }
    .badge {
      display: inline-block;
      background-color: #eef2ff;
      color: #6366f1;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .hero {
      text-align: center;
      padding: 20px;
    }
    .hero h1 {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 8px;
    }
    .hero p {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }
    .content {
      padding: 20px;
    }
    .greeting {
      font-size: 16px;
      color: #1a1a2e;
      margin-bottom: 16px;
    }
    .profile-card {
      background-color: #1a1a2e;
      color: #ffffff;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .profile-card .business-name {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .profile-card .slug {
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 16px;
    }
    .profile-card .btn {
      display: block;
      background-color: #ffffff;
      color: #1a1a2e;
      text-align: center;
      padding: 12px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
    }
    .package-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      margin: 20px 0;
    }
    .package-box .label {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .package-box .package-name {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a2e;
      display: inline-block;
    }
    .package-box .price {
      float: right;
      background-color: #6366f1;
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
    }
    .video-box {
      background-color: #fffbeb;
      border: 2px solid #fbbf24;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .video-box .bonus-badge {
      background-color: #fbbf24;
      color: #78350f;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      display: inline-block;
      margin-bottom: 12px;
    }
    .video-box h3 {
      font-size: 16px;
      font-weight: 700;
      color: #78350f;
      margin: 0 0 8px;
    }
    .video-box p {
      font-size: 14px;
      color: #92400e;
      margin: 0 0 16px;
    }
    .video-placeholder {
      background-color: #1a1a2e;
      height: 200px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }
    .play-button {
      width: 60px;
      height: 60px;
      background-color: #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .video-link {
      color: #6366f1;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
    }
    .credentials-box {
      background-color: #eff6ff;
      border: 1px solid: #93c5fd;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .credentials-box h3 {
      font-size: 14px;
      font-weight: 700;
      color: #1e40af;
      margin: 0 0 16px;
    }
    .credential-card {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
    }
    .credential-card .label {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .credential-card .value {
      font-size: 14px;
      font-family: 'Courier New', monospace;
      color: #1a1a2e;
      font-weight: 600;
    }
    .credential-card .password {
      background-color: #fef3c7;
      padding: 8px;
      border-radius: 4px;
    }
    .warning {
      background-color: #fef3c7;
      color: #78350f;
      padding: 12px;
      border-radius: 8px;
      font-size: 12px;
      margin-bottom: 12px;
    }
    .login-btn {
      display: block;
      background-color: #6366f1;
      color: #ffffff;
      text-align: center;
      padding: 12px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
    }
    .timeline {
      margin: 20px 0;
    }
    .timeline h3 {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 12px;
    }
    .timeline ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .timeline li {
      font-size: 14px;
      color: #475569;
      margin-bottom: 8px;
      padding-left: 12px;
    }
    .timeline strong {
      color: #1a1a2e;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #94a3b8;
    }
    .footer .logo-small {
      font-size: 18px;
      font-weight: 700;
      color: #6366f1;
      margin-bottom: 8px;
    }
    .footer-links {
      margin-top: 12px;
    }
    .footer-links a {
      color: #94a3b8;
      text-decoration: none;
      margin: 0 8px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <div class="logo">eyes AI</div>
      <span class="badge">✨ Welcome to EyesAI</span>
    </div>

    <!-- Hero -->
    <div class="hero">
      <h1>You're officially AI-discoverable</h1>
      <p>Customers can now find you on ChatGPT, Google, Claude & beyond</p>
    </div>

    <!-- Content -->
    <div class="content">
      <p class="greeting">Hi ${data.ownerName},</p>
      <p style="margin-bottom: 20px; color: #475569; font-size: 14px; line-height: 1.6;">
        Congratulations! <strong>${data.businessName}</strong> is now live on EyesAI. Your business profile is optimized and ready to be discovered by customers searching on AI platforms.
      </p>

      <!-- Profile Card -->
      <div class="profile-card">
        <div class="business-name">${data.businessName}</div>
        <div class="slug">@${data.businessSlug}</div>
        <a href="${data.profileUrl}" class="btn">View Your Live Profile →</a>
      </div>

      <!-- Package Info -->
      <div class="package-box">
        <div class="label">YOUR PLAN</div>
        <div>
          <span class="package-name">${data.packageType} Package</span>
          <span class="price">${data.packagePrice}/mo</span>
        </div>
        <div style="clear: both;"></div>
      </div>

      ${data.videoUrl ? `
      <!-- Video Section -->
      <div class="video-box">
        <span class="bonus-badge">🎁 BONUS INCLUDED</span>
        <h3>Your Personalized Welcome Video</h3>
        <p>We created a custom AI-generated video for ${data.businessName}. Share it on social media or embed it on your website!</p>
        <div class="video-placeholder">
          <div class="play-button">
            <div style="width: 0; height: 0; border-left: 15px solid #1a1a2e; border-top: 10px solid transparent; border-bottom: 10px solid transparent; margin-left: 5px;"></div>
          </div>
        </div>
        <a href="${data.videoUrl}" class="video-link">Watch & Download Video</a>
      </div>
      ` : ''}

      <!-- Login Credentials -->
      <div class="credentials-box">
        <h3>📊 Your Client Dashboard</h3>
        <p style="margin: 0 0 12px; font-size: 14px; color: #475569;">
          Access your dashboard to view analytics, update your profile, and see monthly reports.
        </p>

        <div class="credential-card">
          <div class="label">USERNAME (EMAIL)</div>
          <div class="value">${data.clientEmail}</div>
        </div>

        <div class="credential-card">
          <div class="label">TEMPORARY PASSWORD</div>
          <div class="value password">${data.tempPassword}</div>
        </div>

        <div class="warning">
          ⚠️ Please change your password after your first login
        </div>

        <a href="${data.loginUrl}" class="login-btn">Login to Dashboard</a>
      </div>

      <!-- Timeline -->
      <div class="timeline">
        <h3>📅 What happens next?</h3>
        <ul>
          <li><strong>This week:</strong> Your profile starts appearing in AI search results</li>
          <li><strong>Monthly:</strong> You'll receive SEO performance reports via email</li>
          <li><strong>Ongoing:</strong> We continuously optimize your profile for better visibility</li>
        </ul>
      </div>

      <p style="text-align: center; font-size: 14px; color: #64748b; margin-top: 30px;">
        Questions? Reply to this email or reach out at <a href="mailto:support@eyesai.ai" style="color: #6366f1; text-decoration: none;">support@eyesai.ai</a>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="logo-small">eyesAI</div>
      <div>Get seen everywhere, powered by AI</div>
      <div class="footer-links">
        <a href="#">Unsubscribe</a> · <a href="#">Manage Preferences</a>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
