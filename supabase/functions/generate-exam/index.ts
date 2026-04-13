import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { course_title, course_description, exam_type, num_questions, lessons_titles } = await req.json();

    if (!course_title || !exam_type || !num_questions) {
      throw new Error("Missing required fields");
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("API key not configured");

    const examTypeLabel = exam_type === 'midterm' ? 'نصفي (منتصف الدورة)' : 'نهائي (نهاية الدورة)';
    const lessonsContext = lessons_titles?.length
      ? `\nالدروس المشمولة:\n${lessons_titles.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n')}`
      : '';

    const prompt = `أنت خبير في إنشاء امتحانات تعليمية للأطفال والشباب في مجال البرمجة والتكنولوجيا.

أنشئ ${num_questions} سؤال لامتحان ${examTypeLabel} للدورة التالية:
- عنوان الدورة: ${course_title}
- وصف الدورة: ${course_description || 'غير متوفر'}
${lessonsContext}

القواعد:
- اجعل الأسئلة متنوعة بين "اختيار من متعدد" (multiple_choice) و"صح وغلط" (true_false)
- لأسئلة الاختيار من متعدد: 4 خيارات لكل سؤال
- لأسئلة صح وغلط: خياران فقط "صح" و"غلط"
- اجعل الأسئلة مناسبة لمستوى الدورة
- اكتب الأسئلة باللغة العربية
- الدرجة لكل سؤال = 1

أرجع النتيجة كـ JSON array فقط بدون أي نص إضافي، بالصيغة التالية:
[
  {
    "question_text": "نص السؤال",
    "question_type": "multiple_choice",
    "options": ["خيار أ", "خيار ب", "خيار ج", "خيار د"],
    "correct_answer": "خيار أ",
    "points": 1
  },
  {
    "question_text": "نص السؤال",
    "question_type": "true_false",
    "options": ["صح", "غلط"],
    "correct_answer": "صح",
    "points": 1
  }
]`;

    const response = await fetch("https://ai.lovable.dev/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert exam creator. Always respond with valid JSON array only, no markdown or extra text." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    // Clean up markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let questions;
    try {
      questions = JSON.parse(content);
    } catch {
      throw new Error("Failed to parse AI response as JSON");
    }

    if (!Array.isArray(questions)) {
      throw new Error("AI response is not an array");
    }

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
