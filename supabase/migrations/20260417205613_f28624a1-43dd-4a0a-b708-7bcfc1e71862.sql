-- Update instructor RLS to also cover course-level exams (course_id) and questions
DROP POLICY IF EXISTS "Instructors can view submissions for their exams" ON public.exam_submissions;
CREATE POLICY "Instructors can view submissions for their exams"
ON public.exam_submissions FOR SELECT
USING (
  has_role(auth.uid(), 'instructor'::app_role) AND (
    EXISTS (
      SELECT 1 FROM exams e
      LEFT JOIN lessons l ON l.id = e.lesson_id
      LEFT JOIN courses c1 ON c1.id = l.course_id
      LEFT JOIN courses c2 ON c2.id = e.course_id
      WHERE e.id = exam_submissions.exam_id
        AND (c1.instructor_id = auth.uid() OR c2.instructor_id = auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "Instructors can manage exams for their lessons" ON public.exams;
CREATE POLICY "Instructors can manage their exams"
ON public.exams FOR ALL
USING (
  has_role(auth.uid(), 'instructor'::app_role) AND (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN courses c ON c.id = l.course_id
      WHERE l.id = exams.lesson_id AND c.instructor_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM courses c WHERE c.id = exams.course_id AND c.instructor_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Instructors can manage questions for their exams" ON public.exam_questions;
CREATE POLICY "Instructors can manage questions for their exams"
ON public.exam_questions FOR ALL
USING (
  has_role(auth.uid(), 'instructor'::app_role) AND EXISTS (
    SELECT 1 FROM exams e
    LEFT JOIN lessons l ON l.id = e.lesson_id
    LEFT JOIN courses c1 ON c1.id = l.course_id
    LEFT JOIN courses c2 ON c2.id = e.course_id
    WHERE e.id = exam_questions.exam_id
      AND (c1.instructor_id = auth.uid() OR c2.instructor_id = auth.uid())
  )
);