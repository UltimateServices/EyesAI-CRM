import { NextResponse } from 'next/server';

// GET /api/webflow/crm-key - Get the constant CRM API key from environment
export async function GET() {
  const crmApiKey = process.env.CRM_API_KEY;

  if (!crmApiKey) {
    return NextResponse.json(
      { error: 'CRM_API_KEY not configured in environment variables' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    crmApiKey
  });
}
