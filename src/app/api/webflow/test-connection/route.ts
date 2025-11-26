import { NextRequest, NextResponse } from 'next/server';

// POST /api/webflow/test-connection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webflowAppUrl, webflowApiToken, crmApiKey } = body;

    if (!webflowAppUrl || !webflowApiToken || !crmApiKey) {
      return NextResponse.json(
        { error: 'Webflow App URL, Webflow API Token, and CRM API Key are required' },
        { status: 400 }
      );
    }

    // Test connection to Webflow bridge app
    const testEndpoint = `${webflowAppUrl}/api/test`;

    console.log('Testing Webflow connection:', {
      endpoint: testEndpoint,
      hasCrmApiKey: !!crmApiKey,
      hasWebflowToken: !!webflowApiToken,
    });

    const response = await fetch(testEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${crmApiKey}`,
        'X-Webflow-Token': webflowApiToken,
        'Content-Type': 'application/json',
      },
    });

    console.log('Webflow response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webflow connection error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return NextResponse.json(
        {
          error: 'Connection failed',
          details: errorText,
          status: response.status,
          endpoint: testEndpoint
        },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Connection successful',
      data,
    });
  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Connection test failed',
        details: 'Could not reach Webflow bridge app'
      },
      { status: 500 }
    );
  }
}
