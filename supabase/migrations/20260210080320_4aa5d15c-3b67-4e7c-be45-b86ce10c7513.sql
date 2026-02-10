
-- Allow parents to create subscriptions for their linked students
CREATE POLICY "Parents can create subscriptions for linked students"
ON public.subscriptions
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'parent'::app_role)
  AND EXISTS (
    SELECT 1 FROM student_parent_links
    WHERE student_parent_links.parent_id = auth.uid()
      AND student_parent_links.student_id = subscriptions.user_id
  )
);

-- Allow parents to create payment requests for their linked students
CREATE POLICY "Parents can create payment requests for linked students"
ON public.payment_requests
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'parent'::app_role)
  AND EXISTS (
    SELECT 1 FROM student_parent_links
    WHERE student_parent_links.parent_id = auth.uid()
      AND student_parent_links.student_id = payment_requests.user_id
  )
);

-- Allow parents to view payment requests for linked students
CREATE POLICY "Parents can view linked student payments"
ON public.payment_requests
FOR SELECT
USING (
  has_role(auth.uid(), 'parent'::app_role)
  AND EXISTS (
    SELECT 1 FROM student_parent_links
    WHERE student_parent_links.parent_id = auth.uid()
      AND student_parent_links.student_id = payment_requests.user_id
  )
);
