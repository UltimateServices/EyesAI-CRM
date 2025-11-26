import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// POST /api/chat/conversation - Start a new conversation
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const body = await request.json();
    const {
      visitorName,
      visitorEmail,
      visitorPhone,
      visitorId,
      companyId,
      source,
      pageUrl,
      initialMessage,
    } = body;

    if (!initialMessage) {
      return NextResponse.json(
        { error: 'Initial message is required' },
        { status: 400 }
      );
    }

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .insert({
        visitor_name: visitorName,
        visitor_email: visitorEmail,
        visitor_phone: visitorPhone,
        visitor_id: visitorId,
        company_id: companyId,
        status: 'ai_only',
        source: source || 'webflow',
        page_url: pageUrl,
        user_agent: request.headers.get('user-agent'),
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (convError) {
      console.error('Error creating conversation:', convError);
      return NextResponse.json(
        { error: convError.message },
        { status: 500 }
      );
    }

    // Create initial visitor message
    const { data: visitorMessage, error: msgError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversation.id,
        sender_type: 'visitor',
        sender_name: visitorName || 'Visitor',
        message_text: initialMessage,
        message_type: 'text',
        is_read: false,
      })
      .select()
      .single();

    if (msgError) {
      console.error('Error creating message:', msgError);
      return NextResponse.json(
        { error: msgError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      conversation,
      visitorMessage,
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/chat/conversation?conversationId=xxx - Get conversation details
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { searchParams } = new URL(request.url);

    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    const { data: conversation, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Error fetching conversation:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH /api/chat/conversation - Update conversation status
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const body = await request.json();
    const { conversationId, status, assignedVaId, assignedVaName } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) updates.status = status;
    if (assignedVaId) updates.assigned_va_id = assignedVaId;
    if (assignedVaName) updates.assigned_va_name = assignedVaName;
    if (status === 'resolved') updates.resolved_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('chat_conversations')
      .update(updates)
      .eq('id', conversationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating conversation:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ conversation: data });
  } catch (error) {
    console.error('Update conversation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
