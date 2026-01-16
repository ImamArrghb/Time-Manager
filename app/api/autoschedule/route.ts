import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { requestText, todayDate } = await req.json(); 
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "API Key hilang" }, { status: 500 });

    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    // --- 1. CONTEKAN KALENDER (Sudah Benar) ---
    const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const daysEng = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const calendarReference = [];
    const baseDate = new Date(todayDate);

    console.log("--- DEBUG AI CALENDAR ---");
    for (let i = 0; i < 7; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const dayIndex = d.getDay();
        const dayLabel = `${daysIndo[dayIndex]} (${daysEng[dayIndex]})`;
        const line = `- ${dayLabel}: ${dateStr}`;
        calendarReference.push(line);
        console.log(line);
    }
    const calendarCheatSheet = calendarReference.join("\n");

    // --- 2. PROMPT ---
    const systemPrompt = `
      Kamu adalah asisten penjadwalan. TUGASMU ADALAH MEMILIH TANGGAL DARI DAFTAR.
      
      REFERENSI TANGGAL VALID:
      ${calendarCheatSheet}
      
      Instruksi:
      1. Cari kata kunci waktu di permintaan user.
      2. COCOKKAN dengan daftar di atas.
      3. Kategori WAJIB pilih salah satu: "Personal", "Work", "Study", "Health".
      
      Format Output JSON:
      {
        "schedules": [
          {
            "title": "Judul Kegiatan",
            "date": "YYYY-MM-DD", 
            "startTime": "HH:MM",
            "endTime": "HH:MM",
            "category": "Personal",
            "description": "Keterangan singkat"
          }
        ]
      }
    `;

    const completion = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: requestText }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" } 
    });

    const resultText = completion.choices[0]?.message?.content;
    const parsedData = JSON.parse(resultText || "{}");

    // --- 3. FILTER PENJAGA (SANITASI KATEGORI) ---
    // Ini bagian PENTING untuk mengatasi error "check constraint"
    const validCategories = ["Personal", "Work", "Study", "Health"];
    
    const safeSchedules = (parsedData.schedules || []).map((item: any) => {
        // Ambil kategori dari AI, atau default ke 'Personal'
        let cat = item.category || "Personal";

        // Ubah format jadi Title Case (misal: "health" -> "Health")
        cat = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();

        // Cek apakah ada di daftar valid?
        if (!validCategories.includes(cat)) {
            // Kalau AI ngawur (misal kasih "Sport"), kita paksa masuk ke kategori yang paling mirip
            // Atau default-kan saja ke "Personal" agar database mau terima.
            cat = "Personal"; 
        }

        return {
            ...item,
            category: cat
        };
    });

    return NextResponse.json({ data: safeSchedules });

  } catch (error: any) {
    console.error("Error Auto-Schedule:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}