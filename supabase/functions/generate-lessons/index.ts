import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseTitle, courseDescription, ageGroup, topic, lessonsCount } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const count = Math.min(Math.max(lessonsCount || 5, 1), 20);

    const systemPrompt = `You are an expert curriculum designer for children's coding and technology education.
You create structured, engaging lesson plans appropriate for the specified age group.
Always respond in Arabic. Each lesson should be practical and age-appropriate.
Focus on making lessons progressive - each builds on the previous one.`;

    const userPrompt = `أنشئ ${count} دروس لكورس بعنوان "${courseTitle}"${courseDescription ? ` (الوصف: ${courseDescription})` : ''}.
الفئة العمرية: ${ageGroup} سنوات.
${topic ? `الموضوع المحدد: ${topic}` : ''}

لكل درس أعطني:
- title: عنوان الدرس
- description: وصف مختصر (جملة واحدة)
- content: محتوى الدرس بالتفصيل (3-5 فقرات تشمل الشرح والأنشطة)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_lessons",
              description: "Generate a list of structured lessons for a course",
              parameters: {
                type: "object",
                properties: {
                  lessons: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Lesson title in Arabic" },
                        description: { type: "string", description: "Brief description in Arabic" },
                        content: { type: "string", description: "Detailed lesson content in Arabic" },
                      },
                      required: ["title", "description", "content"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["lessons"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_lessons" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، حاول مرة أخرى لاحقاً." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "رصيد غير كافٍ، يرجى إضافة رصيد." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("No structured response from AI");
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ lessons: parsed.lessons }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-lessons error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
