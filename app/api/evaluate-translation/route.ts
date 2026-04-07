import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { vietnamese, userInput } = await req.json();

    if (!vietnamese || !userInput) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const systemPrompt = `Bạn là giáo viên tiếng Trung. Chấm câu dịch.
Trả JSON: { "score": 0-100, "isCorrect": boolean, "feedback": "ngắn gọn", "suggested": "câu chuẩn", "pinyin": "phiên âm", "grammarAnalysis": "phân tích ngữ pháp" }`;

    const userPrompt = `VI: "${vietnamese}"\nUser: "${userInput}"`;

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const content = res.choices[0].message.content || "{}";
    return NextResponse.json(JSON.parse(content));
  } catch (e: any) {
    console.error("Evaluation Error:", e);
    return NextResponse.json(
      { error: e.message || "Failed to evaluate" },
      { status: 500 }
    );
  }
}