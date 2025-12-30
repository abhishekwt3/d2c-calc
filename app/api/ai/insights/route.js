// app/api/ai/insights/route.js
// This file should be placed in: app/api/ai/insights/route.js

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
    const { metrics } = await request.json();

    if (!metrics) {
      return NextResponse.json(
        { error: 'Metrics data is required' },
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

    // Prepare the prompt for Gemini
    const systemInstruction = `You are a senior D2C business analyst and operator with 10+ years of experience scaling e-commerce brands.

Your role is to interpret business performance metrics and explain what they mean in clear, practical terms.

CRITICAL RULES:
- You do NOT calculate numbers. You ONLY interpret the exact numbers provided.
- Never derive, estimate, or compute any metrics yourself.
- Focus exclusively on what the given numbers tell you.

You must:
- Explain what the metrics indicate about the business health
- Identify specific risks, inefficiencies, and strengths
- Highlight what is working well and what is broken
- Give clear, actionable recommendations with specific targets
- Avoid generic advice like "improve marketing" - be specific
- Reference actual numbers from the metrics when making points

Your communication style:
- Assume the user is a founder or operator, not a beginner
- Be concise, factual, and decision-oriented
- Avoid buzzwords and marketing language
- Use direct language: "Your CAC is too high" not "Consider optimizing customer acquisition"
- Focus on profitability, efficiency, and scalability

Structure your response as:
1. **Key Insight** (2-3 sentences) - The single most important thing these numbers reveal
2. **Health Check** (4-5 detailed bullets) - What's strong (✅) vs concerning (⚠️) with explanations
3. **Top 3 Actions** (detailed, numbered) - Concrete steps with:
   - Specific action to take
   - Target metrics/outcomes
   - Expected impact
   - Implementation approach

Keep total response around 500 words. Provide detailed, actionable analysis. Be ruthlessly practical.`;

    const userPrompt = `Analyze this D2C business performance:

**PROFITABILITY METRICS:**
- Net Revenue: ${formatCurrency(metrics.netRevenue)}
- Contribution Margin: ${formatCurrency(metrics.cmDollars)} (${metrics.cmPercent.toFixed(1)}% of revenue)
- EBITDA: ${formatCurrency(metrics.ebitda)} ${metrics.ebitda > 0 ? '✅ Profitable' : '⚠️ Loss-making'}

**EFFICIENCY METRICS:**
- MER (Marketing Efficiency): ${metrics.mer.toFixed(2)}x (Revenue/Ad Spend)
- Blended CAC (New Customers Only): ${formatCurrency(metrics.blendedCac)}
- Cost Per Order (All Orders): ${formatCurrency(metrics.costPerOrder)}

**SCALING METRICS:**
- Safe Max CPA (Bid Limit): ${formatCurrency(metrics.safeMaxCpa)}
- Net Cash Burn (Monthly): ${formatCurrency(metrics.netBurn)}
- Total Ad Spend (Monthly): ${formatCurrency(metrics.adSpendTotal)}

Based on ONLY these exact numbers, provide a comprehensive analysis:

1. **Key Insight** - What's the critical issue or opportunity here? Be specific and explain the underlying dynamics.

2. **Health Check** - Deep dive into each key metric:
   - ✅ Strong metrics (explain why they're strong and what they enable)
   - ⚠️ Concerning metrics (explain the risk and what breaks if left unaddressed)
   - Include context about why each metric matters

3. **Top 3 Actions** - Give detailed, implementable recommendations:
   - What specific action to take
   - What target metrics/outcomes to aim for
   - Why this matters (expected impact on business)
   - How to implement (concrete steps)
   - What to watch for (success indicators)

IMPORTANT: Complete all three sections with detailed analysis. You have 500 words - use them to provide deep, actionable insights. Be direct and practical. Speak like you're advising a fellow operator who needs to make decisions today.`;

    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemInstruction}\n\n${userPrompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,  // Lower = more focused and consistent
          topK: 20,  // More selective token choices
          topP: 0.8,  // More deterministic
          maxOutputTokens: 1600,  // ~500 words + formatting buffer
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
        { error: 'Failed to generate insights' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract text from Gemini response
    let insights = '';
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      insights = data.candidates[0].content.parts[0].text;
      
      // Check if response was truncated
      const finishReason = data.candidates[0]?.finishReason;
      if (finishReason === 'MAX_TOKENS') {
        console.warn('Response was truncated due to token limit');
        insights += '\n\n[Response truncated - please try SignalROI full version for complete analysis]';
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
      { insights },
      { status: 200 }
    );

  } catch (error) {
    console.error('AI insights error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}