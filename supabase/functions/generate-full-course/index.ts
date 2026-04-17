import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { courseTitle, ageGroup, lessonsCount, includeExam, examQuestionsCount, topic } = await req.json();

    if (!courseTitle || !ageGroup) {
      return new Response(JSON.stringify({ error: "courseTitle and ageGroup required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const lc = Math.min(Math.max(lessonsCount || 6, 1), 20);
    const qc = Math.min(Math.max(examQuestionsCount || 5, 1), 20);

    const systemPrompt = `أنت خبير مناهج تعليمية للأطفال في البرمجة والتكنولوجيا. صمم محتوى احترافياً ومتدرجاً ومناسباً للفئة العمرية. اكتب باللغة العربية.`;

    const userPrompt = `صمم كورساً متكاملاً بعنوان "${courseTitle}" للفئة العمرية ${ageGroup} سنوات.
${topic ? `الموضوع: ${topic}` : ''}

المطلوب:
1. وصف الكورس (2-3 جمل).
2. ${lc} درس متدرج، كل درس يحتوي على عنوان ووصف ومحتوى تفصيلي (3-5 فقرات).
${includeExam ? `3. امتحان نهائي يحتوي ${qc} سؤال متنوع (اختيار من متعدد + صح وغلط) لتقييم الكورس.` : ''}`;

    const tools = [
      {
        type: "function",
        function: {
          name: "build_course",
          description: "Build a complete course with lessons and optional exam",
          parameters: {
            type: "object",
            properties: {
              description: { type: "string" },
              lessons: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    content: { type: "string" },
                  },
                  required: ["title", "description", "content"],
                  additionalProperties: false,
                },
              },
              ...(includeExam ? {
                exam: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    duration_minutes: { type: "number" },
                    questions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          question_text: { type: "string" },
                          question_type: { type: "string", enum: ["multiple_choice", "true_false"] },
                          options: { type: "array", items: { type: "string" } },
                          correct_answer: { type: "string" },
                          points: { type: "number" },
                        },
                        required: ["question_text", "question_type", "options", "correct_answer", "points"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["title", "duration_minutes", "questions"],
                  additionalProperties: false,
                },
              } : {}),
            },
            required: includeExam ? ["description", "lessons", "exam"] : ["description", "lessons"],
            additionalProperties: false,
          },
        },
      },
    ];

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "build_course" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، حاول لاحقاً." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "رصيد الذكاء الاصطناعي غير كافٍ." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      throw new Error("AI gateway error");
    }

    const data = await resp.json();
    const tc = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!tc?.function?.arguments) throw new Error("No structured response");
    const parsed = JSON.parse(tc.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-full-course error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
