import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Search,
  BookOpen,
  CheckCircle,
  Clock,
  CreditCard,
  Crown,
  Mail,
  GraduationCap,
  Calendar,
} from 'lucide-react';

interface StudentInfo {
  user_id: string;
  full_name: string;
  email: string;
  enrolled_courses: { id: string; title: string }[];
  completed_lessons: number;
  total_lessons: number;
  subscription_status: string | null;
  subscription_plan: string | null;
  subscription_expires: string | null;
  has_parent: boolean;
  parent_name: string | null;
}

const StudentManagement = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  useEffect(() => {
    if (user) fetchStudents();
  }, [user]);

  const fetchStudents = async () => {
    try {
      // 1. Get instructor's courses
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title')
        .eq('instructor_id', user!.id);

      if (!courses || courses.length === 0) {
        setLoading(false);
        return;
      }

      const courseIds = courses.map((c) => c.id);
      const courseMap = new Map(courses.map((c) => [c.id, c.title]));

      // 2. Get enrollments for these courses
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('user_id, course_id')
        .in('course_id', courseIds);

      if (!enrollments || enrollments.length === 0) {
        setLoading(false);
        return;
      }

      // Group enrollments by student
      const studentCourseMap = new Map<string, { id: string; title: string }[]>();
      for (const e of enrollments) {
        const existing = studentCourseMap.get(e.user_id) || [];
        existing.push({ id: e.course_id, title: courseMap.get(e.course_id) || '' });
        studentCourseMap.set(e.user_id, existing);
      }

      const studentIds = Array.from(studentCourseMap.keys());

      // 3. Fetch profiles, progress, subscriptions, parent links in parallel
      const [profilesRes, progressRes, subscriptionsRes, parentLinksRes] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, email').in('user_id', studentIds),
        supabase
          .from('progress')
          .select('user_id, completed, lesson_id')
          .in('user_id', studentIds),
        supabase
          .from('subscriptions')
          .select('user_id, status, expires_at, subscription_plans(name)')
          .in('user_id', studentIds)
          .order('created_at', { ascending: false }),
        supabase
          .from('student_parent_links')
          .select('student_id, parent_id')
          .in('student_id', studentIds),
      ]);

      // Get parent names
      const parentIds = parentLinksRes.data?.map((l) => l.parent_id) || [];
      let parentProfileMap = new Map<string, string>();
      if (parentIds.length > 0) {
        const { data: parentProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', parentIds);
        if (parentProfiles) {
          parentProfileMap = new Map(parentProfiles.map((p) => [p.user_id, p.full_name]));
        }
      }

      // Build parent link map: student_id -> parent_name
      const studentParentMap = new Map<string, string>();
      parentLinksRes.data?.forEach((link) => {
        const parentName = parentProfileMap.get(link.parent_id);
        if (parentName) studentParentMap.set(link.student_id, parentName);
      });

      // Get total lessons per course
      const { data: allLessons } = await supabase
        .from('lessons')
        .select('id, course_id')
        .in('course_id', courseIds);

      // Map lessons per student
      const lessonsByCourse = new Map<string, string[]>();
      allLessons?.forEach((l) => {
        const existing = lessonsByCourse.get(l.course_id) || [];
        existing.push(l.id);
        lessonsByCourse.set(l.course_id, existing);
      });

      // Build progress map: user_id -> Set<completed_lesson_id>
      const completedMap = new Map<string, Set<string>>();
      progressRes.data?.forEach((p) => {
        if (p.completed) {
          const set = completedMap.get(p.user_id) || new Set();
          set.add(p.lesson_id);
          completedMap.set(p.user_id, set);
        }
      });

      // Build subscription map: user_id -> latest subscription
      const subMap = new Map<string, any>();
      subscriptionsRes.data?.forEach((s: any) => {
        if (!subMap.has(s.user_id)) {
          subMap.set(s.user_id, s);
        }
      });

      // Build profiles map
      const profileMap = new Map<string, { full_name: string; email: string }>();
      profilesRes.data?.forEach((p) => {
        profileMap.set(p.user_id, { full_name: p.full_name, email: p.email });
      });

      // Assemble student data
      const studentList: StudentInfo[] = studentIds.map((sid) => {
        const profile = profileMap.get(sid);
        const enrolledCourses = studentCourseMap.get(sid) || [];
        const completedSet = completedMap.get(sid) || new Set();

        // Total lessons for enrolled courses
        let totalLessons = 0;
        for (const ec of enrolledCourses) {
          totalLessons += lessonsByCourse.get(ec.id)?.length || 0;
        }

        // Completed lessons that belong to enrolled courses
        let completedLessons = 0;
        for (const ec of enrolledCourses) {
          const courseLessonIds = lessonsByCourse.get(ec.id) || [];
          completedLessons += courseLessonIds.filter((lid) => completedSet.has(lid)).length;
        }

        const sub = subMap.get(sid);

        return {
          user_id: sid,
          full_name: profile?.full_name || 'Unknown',
          email: profile?.email || '',
          enrolled_courses: enrolledCourses,
          completed_lessons: completedLessons,
          total_lessons: totalLessons,
          subscription_status: sub?.status || null,
          subscription_plan: (sub?.subscription_plans as any)?.name || null,
          subscription_expires: sub?.expires_at || null,
          has_parent: studentParentMap.has(sid),
          parent_name: studentParentMap.get(sid) || null,
        };
      });

      setStudents(studentList);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const openStudentDetail = async (student: StudentInfo) => {
    setSelectedStudent(student);
    setDetailOpen(true);

    // Fetch payment history
    const { data: payments } = await supabase
      .from('payment_requests')
      .select('*, subscription_plans(name)')
      .eq('user_id', student.user_id)
      .order('created_at', { ascending: false });

    setPaymentHistory(payments || []);
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">No Subscription</Badge>;
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/15">Active</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 hover:bg-amber-500/15">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="w-7 h-7 text-primary" />
          Students
        </h1>
        <p className="text-muted-foreground">
          View and manage students enrolled in your courses
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter((s) => s.subscription_status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">With Parents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter((s) => s.has_parent).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.length > 0
                ? Math.round(
                    students.reduce(
                      (acc, s) =>
                        acc + (s.total_lessons > 0 ? (s.completed_lessons / s.total_lessons) * 100 : 0),
                      0
                    ) / students.length
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Students</CardTitle>
              <CardDescription>{students.length} students enrolled</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {students.length === 0 ? 'No Students Yet' : 'No Results'}
              </h3>
              <p className="text-muted-foreground">
                {students.length === 0
                  ? 'Students will appear here when they enroll in your courses'
                  : 'Try a different search query'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead className="w-20">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => {
                  const progressPercent =
                    student.total_lessons > 0
                      ? Math.round((student.completed_lessons / student.total_lessons) * 100)
                      : 0;

                  return (
                    <TableRow key={student.user_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.full_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {student.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {student.enrolled_courses.slice(0, 2).map((c) => (
                            <Badge key={c.id} variant="secondary" className="text-xs">
                              {c.title}
                            </Badge>
                          ))}
                          {student.enrolled_courses.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{student.enrolled_courses.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={progressPercent} className="flex-1" />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {progressPercent}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(student.subscription_status)}</TableCell>
                      <TableCell>
                        {student.has_parent ? (
                          <span className="text-sm flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                            {student.parent_name}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openStudentDetail(student)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Student Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedStudent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  {selectedStudent.full_name}
                </DialogTitle>
                <DialogDescription>{selectedStudent.email}</DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                {/* Progress Overview */}
                <div className="grid gap-3 grid-cols-3">
                  <Card>
                    <CardContent className="pt-4 pb-3 text-center">
                      <CheckCircle className="w-5 h-5 mx-auto mb-1 text-primary" />
                      <p className="text-xl font-bold">{selectedStudent.completed_lessons}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3 text-center">
                      <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xl font-bold">
                        {selectedStudent.total_lessons - selectedStudent.completed_lessons}
                      </p>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3 text-center">
                      <BookOpen className="w-5 h-5 mx-auto mb-1 text-primary" />
                      <p className="text-xl font-bold">{selectedStudent.enrolled_courses.length}</p>
                      <p className="text-xs text-muted-foreground">Courses</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Enrolled Courses */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Enrolled Courses
                  </h4>
                  <div className="space-y-2">
                    {selectedStudent.enrolled_courses.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{c.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subscription Info */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Crown className="w-4 h-4" /> Subscription
                  </h4>
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {selectedStudent.subscription_plan || 'No Subscription'}
                        </p>
                        {selectedStudent.subscription_expires && (
                          <p className="text-xs text-muted-foreground">
                            Expires:{' '}
                            {new Date(selectedStudent.subscription_expires).toLocaleDateString('ar-EG')}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(selectedStudent.subscription_status)}
                    </div>
                  </div>
                </div>

                {/* Parent Info */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Parent
                  </h4>
                  <div className="p-3 rounded-lg border bg-muted/30">
                    {selectedStudent.has_parent ? (
                      <p className="text-sm font-medium">{selectedStudent.parent_name}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No parent linked</p>
                    )}
                  </div>
                </div>

                {/* Payment History */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Payment History
                  </h4>
                  {paymentHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3 rounded-lg border bg-muted/30">
                      No payments found
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {paymentHistory.map((payment: any) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {(payment.subscription_plans as any)?.name || 'Plan'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(payment.created_at).toLocaleDateString('ar-EG')} •{' '}
                              {payment.payment_method}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{payment.amount} EGP</p>
                            <Badge
                              variant={
                                payment.status === 'approved'
                                  ? 'default'
                                  : payment.status === 'pending'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                              className="text-xs"
                            >
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentManagement;
