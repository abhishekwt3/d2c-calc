// app/api/mailchimp/subscribe/route.js
// This file should be placed in: app/api/mailchimp/subscribe/route.js

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, listType } = await request.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Get Mailchimp credentials from environment variables
    const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
    const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;
    const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX; // e.g., 'us21'

    if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID || !MAILCHIMP_SERVER_PREFIX) {
      console.error('Missing Mailchimp environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Prepare Mailchimp API request
    const url = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`;
    
    const data = {
      email_address: email,
      status: 'subscribed',
      tags: [listType === 'automation' ? 'Automation Waitlist' : 'Beta Waitlist'],
      merge_fields: {
        SOURCE: listType === 'automation' ? 'Upsell Form' : 'Beta Footer Form',
        SIGNUP_DATE: new Date().toISOString()
      }
    };

    // Call Mailchimp API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      // Handle specific Mailchimp errors
      if (responseData.title === 'Member Exists') {
        return NextResponse.json(
          { error: 'This email is already subscribed!' },
          { status: 400 }
        );
      }
      
      console.error('Mailchimp API error:', responseData);
      return NextResponse.json(
        { error: responseData.detail || 'Failed to subscribe' },
        { status: response.status }
      );
    }

    // Success
    return NextResponse.json(
      { 
        success: true, 
        message: 'Successfully subscribed to waitlist',
        id: responseData.id 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}