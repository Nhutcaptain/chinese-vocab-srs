import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import clientPromise from "@/lib/mongodb";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { username, mode, topic, count = 10 } = await req.json();

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    let contextVocab = "";
    
    if (mode === 'recent') {
      const client = await clientPromise;
      const db = client.db();
      const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
      
      const recentVocab = await db.collection("vocab")
        .find({ 
          username, 
          createdAt: { $gt: threeDaysAgo } 
        })
        .limit(20)
        .toArray();
      
      if (recentVocab.length > 0) {
        contextVocab = recentVocab.map(v => `${v.chinese.join('/')} (${v.vietnamese.join('/')})`).join(", ");
      }
    }

    const systemPrompt = `Bạn là một giáo viên tiếng Trung chuyên nghiệp và chuyên sâu về ngôn ngữ học. 
Hãy tạo bài tập dịch từ tiếng Việt sang tiếng Trung.
Trả về bài tập dưới dạng JSON array của các đối tượng: 
{ 
  "vietnamese": "câu tiếng Việt", 
  "chinese": "đáp án tiếng Trung chuẩn", 
  "pinyin": "phiên âm", 
  "explanation": "PHÂN TÍCH NGỮ PHÁP CHUYÊN SÂU: Giải thích cặn kẽ cấu trúc câu, lý do chọn từ vựng này thay vì từ vựng khác, phân tích các thành phần (Chủ ngữ, Vị ngữ, Bổ ngữ...) nếu cần để người học hiểu bản chất ngôn ngữ." 
}
Chỉ trả về JSON, không thêm văn bản khác.`;

    const userPrompt = mode === 'recent' 
      ? `Tạo ${count} câu bài tập dịch sử dụng một số từ vựng sau đây: ${contextVocab}. Các câu nên tự nhiên và có độ khó vừa phải.`
      : `Tạo ${count} câu bài tập dịch về chủ đề: "${topic}". Các câu nên xoay quanh các tình huống thực tế cá nhân.`;

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.8,
      response_format: { type: "json_object" }
    });

    const content = res.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);
    
    // OpenAI might return { "exercises": [...] } or just the array if we are lucky.
    // Let's normalize it.
    const questions = parsed.exercises || parsed.questions || (Array.isArray(parsed) ? parsed : Object.values(parsed)[0]);

    return NextResponse.json(questions);
  } catch (e: any) {
    console.error("OpenAI Error:", e);
    return NextResponse.json({ error: e.message || "Failed to generate exercises" }, { status: 500 });
  }
}