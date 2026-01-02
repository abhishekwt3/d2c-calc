// app/api/ai/chat/route.js
// This file should be placed in: app/api/ai/chat/route.js

import { NextResponse } from 'next/server';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

export async function POST(request) {
  try {
    const { metrics, messages } = await request.json();

    if (!metrics) {
      return NextResponse.json(
        { error: 'Metrics data is required' },
        { status: 400 }
      );
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    // Get Google Gemini API key from environment
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      console.error('Missing GEMINI_API_KEY environment variable');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // System instruction for conversational agent
    const systemInstruction = `You are a sharp D2C business advisor who spots problems and opportunities immediately. Give direct, insightful advice.

**USER'S CURRENT METRICS:**
- Net Revenue: ${formatCurrency(metrics.netRevenue)}
- Contribution Margin: ${formatCurrency(metrics.cmDollars)} (${metrics.cmPercent.toFixed(1)}% margin)
- EBITDA: ${formatCurrency(metrics.ebitda)} ${metrics.ebitda > 0 ? '(Profitable)' : '(Losing money)'}
- MER (Marketing Efficiency): ${metrics.mer.toFixed(2)}x
- Blended CAC: ${formatCurrency(metrics.blendedCac)}
- Cost Per Order: ${formatCurrency(metrics.costPerOrder)}
- Safe Max CPA: ${formatCurrency(metrics.safeMaxCpa)}
- Net Cash Burn: ${formatCurrency(metrics.netBurn)}
- Total Ad Spend: ${formatCurrency(metrics.adSpendTotal)}

**YOUR APPROACH:**
- Spot the real issue immediately
- Give specific numbers and actions
- Point out what they're missing
- Challenge assumptions if needed
- Compare to healthy benchmarks

**RESPONSE STYLE:**
- Start with the insight or problem
- Use their actual numbers to prove your point
- End with 1-2 specific actions
- 2-3 short paragraphs max
- No fluff or obvious statements

**EXAMPLES:**

Q: "What is Safe Max CPA?"
A: "Your Safe Max CPA is ${formatCurrency(metrics.safeMaxCpa)} - that's the ceiling before you lose money on new customers. Right now you're at ${formatCurrency(metrics.blendedCac)}, so you have ${formatCurrency(metrics.safeMaxCpa - metrics.blendedCac)} of room. But here's what matters: with ${metrics.ebitda < 0 ? 'negative' : 'positive'} EBITDA, scaling CAC up would burn more cash. Fix profitability first, then use that headroom."

Q: "Why is my EBITDA negative?"
A: "You're bleeding ${formatCurrency(Math.abs(metrics.ebitda))} monthly because ad spend (${formatCurrency(metrics.adSpendTotal)}) + OpEx (${formatCurrency(metrics.adSpendTotal)}) eat ${((metrics.adSpendTotal / metrics.cmDollars) * 100).toFixed(0)}% of your CM. Healthy brands keep marketing under 60% of CM. Cut ad spend to ${formatCurrency(metrics.cmDollars * 0.5)} or reduce OpEx by ${formatCurrency(Math.abs(metrics.ebitda))} to reach breakeven immediately."

Q: "How much can I scale?"
A: "Not much right now - you're already burning ${formatCurrency(Math.abs(metrics.netBurn))} monthly including inventory. Your CAC has room (${formatCurrency(metrics.safeMaxCpa - metrics.blendedCac)} to max), but EBITDA is ${metrics.ebitda < 0 ? 'negative' : 'positive'}. Fix the unit economics first: either cut ${formatCurrency(Math.abs(metrics.ebitda))} in costs or boost CM by ${((Math.abs(metrics.ebitda) / metrics.cmDollars) * 100).toFixed(0)}%. Then scale profitably."

Be direct. Uncover the real problem. Give specific actions.`;

    // Prepare conversation for Gemini
    const conversationParts = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: conversationParts,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 800,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Gemini API error:', error);
      return NextResponse.json(
        { error: 'Failed to generate response' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract text from Gemini response
    let reply = '';
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      reply = data.candidates[0].content.parts[0].text;
      
      // Check if response was truncated
      const finishReason = data.candidates[0]?.finishReason;
      if (finishReason === 'MAX_TOKENS') {
        console.warn('Response was truncated due to token limit');
      } else if (finishReason === 'SAFETY') {
        console.error('Response blocked by safety filters');
        return NextResponse.json(
          { error: 'Content filtered by safety settings' },
          { status: 400 }
        );
      }
    } else {
      console.error('Unexpected Gemini response format:', data);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { reply },
      { status: 200 }
    );

  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}