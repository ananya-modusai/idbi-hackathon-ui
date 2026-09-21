import Groq from "groq-sdk";
import { NextResponse } from 'next/server';

async function generateTabPrompts(tab: string, basePrompts: string[]): Promise<string> {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      dangerouslyAllowBrowser: true 
    });
    
    const prompt = `Given the context of the tab "${tab}" and the base prompts: ${basePrompts.join(", ")},  
generate exactly 3 additional prompts specifically tailored to deepen the investigation of this topic.  
Each prompt should be concise (5-6 words max) and formatted as follows:  
1. [prompt]  
2. [prompt]  
3. [prompt]`;

    const response = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "mixtral-8x7b-32768",
      temperature: 0.7,
      max_tokens: 1024,
    });

    return response.choices[0]?.message?.content || '';
}

export async function POST(request: Request) {
  try {
    const { tab, basePrompts } = await request.json();

    if (!tab || !basePrompts || !Array.isArray(basePrompts)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const generatedPrompts = await generateTabPrompts(tab, basePrompts);

    return NextResponse.json({ prompts: generatedPrompts });
  } catch (error) {
    console.error('Error generating prompts:', error);
    return NextResponse.json({ error: 'Failed to generate prompts' }, { status: 500 });
  }
}
