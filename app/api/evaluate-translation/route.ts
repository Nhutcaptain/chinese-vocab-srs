import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const preferredRegion = 'iad1';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY. Please add it to Vercel Settings." }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });
    const { vietnamese, userInput } = await req.json();

    if (!vietnamese || !userInput) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const systemPrompt = `Bạn là giáo viên tiếng Trung chuyên nghiệp. Hãy chấm điểm câu dịch của học sinh (Việt -> Trung).
Trả về JSON:
{ 
  "score": 0-100, 
  "isCorrect": boolean (true nếu score >= 80), 
  "feedback": "Nhận xét ngắn gọn về ý nghĩa", 
  "suggested": "Câu chuẩn nhất", 
  "pinyin": "Pinyin câu chuẩn", 
  "grammarAnalysis": "GIẢI THÍCH NGỮ PHÁP CHUYÊN SÂU: Phân tích kỹ các thành phần (Chủ ngữ, Vị ngữ, Bổ ngữ...), giải thích cấu trúc ngữ pháp được dùng và tại sao lại dùng từ vựng này. Đây là phần kiến thức quan trọng nhất." 
}`;

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