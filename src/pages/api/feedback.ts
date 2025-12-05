import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const env = import.meta.env as Record<string, string | undefined>;
const supabaseUrl = env.PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY || env.PUBLIC_SUPABASE_KEY || '';

const baseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const POST: APIRoute = async ({ request }) => {
  if (!baseClient) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '')
      : undefined;

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Sign in required for feedback' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    const { data: userResult, error: userError } = await supabase.auth.getUser();
    if (userError || !userResult?.user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const message = (body.message || '').toString().trim();
    const userEmail = userResult.user.email || 'unknown@user.local';
    const userName = (userResult.user.user_metadata?.name || 'Anonymous').toString();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Store feedback in database
    const { error: insertError } = await supabase
      .from('feedback')
      .insert({ 
        name: userName, 
        email: userEmail, 
        message 
      });

    if (insertError) {
      console.error('Failed to store feedback:', insertError);
      // Continue anyway - we'll log it
    }

    // Try to send email if configured, but don't fail if not
    const resendApiKey = env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'feedback@straywatch.org',
            to: 'info@straywatch.org',
            subject: `New Feedback from ${userEmail}`,
            html: `
              <h2>New Feedback Submission</h2>
              <p><strong>From:</strong> ${userName} (${userEmail})</p>
              <p><strong>Message:</strong></p>
              <p>${message.replace(/\n/g, '<br>')}</p>
              <hr>
              <p><small>Submitted via StrayWatch Feedback Form</small></p>
            `,
          }),
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
