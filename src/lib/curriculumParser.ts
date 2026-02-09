export interface GeneratedLesson {
  title: string;
  description: string;
  objective: string;
  activity: string;
  duration: string;
}

export interface GeneratedModule {
  name: string;
  lessons: GeneratedLesson[];
}

export type LanguageMode = 'english' | 'arabic' | 'bilingual';

const DURATION_MAP: Record<string, string> = {
  '6-8': '30 mins',
  '9-12': '40 mins',
  '13-15': '50 mins',
  '16-18': '60 mins',
};

/**
 * Detect module/section headers in the text.
 * Supports patterns like:
 *  - "Module 1: Title" / "الوحدة 1: العنوان"
 *  - "Unit 1 - Title"
 *  - "Chapter 1. Title"
 *  - Lines in ALL CAPS or ending with ":"
 *  - Numbered items at the start "1. Topic" when followed by sub-items
 */
function splitIntoModules(text: string): { name: string; body: string }[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // Regex for explicit module/unit/chapter headers
  const headerRe =
    /^(module|unit|chapter|section|الوحدة|الفصل|القسم)\s*\d*\s*[:\-–—.]\s*/i;

  // Try to find explicit headers first
  const headerIndices: number[] = [];
  lines.forEach((line, i) => {
    if (headerRe.test(line)) {
      headerIndices.push(i);
    }
  });

  if (headerIndices.length >= 2) {
    return headerIndices.map((idx, i) => {
      const endIdx = i + 1 < headerIndices.length ? headerIndices[i + 1] : lines.length;
      const name = lines[idx].replace(headerRe, '').replace(/^[:\-–—.\s]+/, '').trim() || lines[idx];
      const body = lines.slice(idx + 1, endIdx).join('\n');
      return { name, body };
    });
  }

  // Fallback: treat numbered top-level items as modules
  const numberedRe = /^(\d+)[.)]\s+/;
  const numberedIndices: number[] = [];
  lines.forEach((line, i) => {
    if (numberedRe.test(line)) {
      numberedIndices.push(i);
    }
  });

  if (numberedIndices.length >= 2) {
    return numberedIndices.map((idx, i) => {
      const endIdx = i + 1 < numberedIndices.length ? numberedIndices[i + 1] : lines.length;
      const name = lines[idx].replace(numberedRe, '').trim();
      const body = lines.slice(idx + 1, endIdx).join('\n');
      return { name, body };
    });
  }

  // Ultimate fallback: split by blank-line groups or every 3-5 lines
  const chunkSize = Math.max(3, Math.ceil(lines.length / Math.min(lines.length, 5)));
  const modules: { name: string; body: string }[] = [];
  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, i + chunkSize);
    modules.push({ name: chunk[0], body: chunk.slice(1).join('\n') });
  }
  return modules;
}

function extractTopicsFromBody(body: string): string[] {
  const lines = body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // Try to detect bullet/numbered sub-items
  const bulletRe = /^[-•*▸▹►]\s+/;
  const subNumberRe = /^(\d+[.)a-z]?|[a-z][.)]\s)/i;

  const topics = lines
    .map((l) => l.replace(bulletRe, '').replace(subNumberRe, '').trim())
    .filter((l) => l.length > 2);

  return topics.length > 0 ? topics : lines;
}

function generateLessonContent(
  topic: string,
  ageGroup: string,
  lang: LanguageMode,
  index: number
): GeneratedLesson {
  const duration = DURATION_MAP[ageGroup] || '45 mins';

  if (lang === 'arabic') {
    return {
      title: `الدرس ${index + 1}: ${topic}`,
      description: `سيتعلم الطلاب أساسيات ${topic} من خلال أنشطة تفاعلية مناسبة للفئة العمرية ${ageGroup}`,
      objective: `فهم وتطبيق مفاهيم ${topic}`,
      activity: `نشاط عملي: مشروع صغير عن ${topic}`,
      duration,
    };
  }

  if (lang === 'bilingual') {
    return {
      title: `Lesson ${index + 1}: ${topic} | الدرس ${index + 1}: ${topic}`,
      description: `Students will learn the fundamentals of ${topic} through interactive activities suited for ages ${ageGroup}.\nسيتعلم الطلاب أساسيات ${topic} من خلال أنشطة تفاعلية.`,
      objective: `Understand and apply ${topic} concepts | فهم وتطبيق مفاهيم ${topic}`,
      activity: `Hands-on activity: Mini project on ${topic} | نشاط عملي: مشروع صغير عن ${topic}`,
      duration,
    };
  }

  // English
  return {
    title: `Lesson ${index + 1}: ${topic}`,
    description: `Students will learn the fundamentals of ${topic} through interactive activities suited for ages ${ageGroup}.`,
    objective: `Understand and apply ${topic} concepts`,
    activity: `Hands-on activity: Mini project on ${topic}`,
    duration,
  };
}

export function parseCurriculum(
  curriculumText: string,
  ageGroup: string,
  language: LanguageMode
): GeneratedModule[] {
  const rawModules = splitIntoModules(curriculumText);

  return rawModules.map((mod) => {
    const topics = extractTopicsFromBody(mod.body);

    // If no sub-topics found, create a single lesson from the module name
    const lessons =
      topics.length > 0
        ? topics.map((topic, i) => generateLessonContent(topic, ageGroup, language, i))
        : [generateLessonContent(mod.name, ageGroup, language, 0)];

    return {
      name: mod.name,
      lessons,
    };
  });
}
