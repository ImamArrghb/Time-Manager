import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1. Terima data statistik dari Frontend
    const { statsText } = await req.json();
    
    // Pastikan API Key ada
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key Groq belum disetting" }, { status: 500 });
    }

    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    // 2. Buat Prompt Khusus untuk "AI Coach"
    const prompt = `
      Bertindaklah sebagai 'Productivity Data Analyst' & 'Life Coach' yang santai tapi tajam.
      
      DATA PRODUKTIVITAS USER HARI INI:
      ${statsText}
      
      Tugasmu:
      1. Analisis keseimbangan hidup user (Work-Life Balance).
      2. Berikan pujian jika produktif.
      3. Berikan teguran jenaka jika terlalu banyak santai (Personal/Entertainment).
      4. Ingatkan istirahat jika terlalu diforsir kerja/belajar.
      5. Akhiri dengan satu kalimat motivasi pendek.
      
      Gunakan Bahasa Indonesia yang gaul, akrab, dan tidak kaku. Maksimal 3-4 kalimat.
    `;

    // 3. Kirim ke AI
    const completion = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile", // Model yang cepat & pintar
    });

    const text = completion.choices[0]?.message?.content || "Gagal menganalisis.";

    return NextResponse.json({ analysis: text });

  } catch (error: any) {
    console.error("Error Groq:", error);
    return NextResponse.json({ error: error.message || "Gagal menghubungi AI" }, { status: 500 });
  }
}