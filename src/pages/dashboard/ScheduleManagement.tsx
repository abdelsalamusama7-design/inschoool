import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Calendar, Clock, BookOpen, Pencil } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  age_group: string;
}

interface Schedule {
  id: string;
  course_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  course?: Course;
}

const DAYS = [
  { value: 0, label: 'Sunday', labelAr: 'الأحد' },
  { value: 1, label: 'Monday', labelAr: 'الاثنين' },
  { value: 2, label: 'Tuesday', labelAr: 'الثلاثاء' },
  { value: 3, label: 'Wednesday', labelAr: 'الأربعاء' },
  { value: 4, label: 'Thursday', labelAr: 'الخميس' },
  { value: 5, label: 'Friday', labelAr: 'الجمعة' },
  { value: 6, label: 'Saturday', labelAr: 'السبت' },
];

const ScheduleManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // Form state
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [coursesRes, schedulesRes] = await Promise.all([
        supabase
          .from('courses')
          .select('id, title, age_group')
          .eq('instructor_id', user!.id)
          .order('title'),
        supabase
          .from('schedules')
          .select('*, courses!inner(id, title, age_group)')
          .order('day_of_week'),
      ]);

      if (coursesRes.data) setCourses(coursesRes.data);

      if (schedulesRes.data) {
        const mapped = schedulesRes.data
          .filter((s: any) => {
            // Only show schedules for instructor's own courses
            return coursesRes.data?.some((c) => c.id === s.course_id);
          })
          .map((s: any) => ({
            id: s.id,
            course_id: s.course_id,
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
            course: s.courses,
          }));
        setSchedules(mapped);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCourse('');
    setSelectedDay('');
    setStartTime('');
    setEndTime('');
    setEditingSchedule(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setSelectedCourse(schedule.course_id);
    setSelectedDay(String(schedule.day_of_week));
    setStartTime(schedule.start_time.slice(0, 5));
    setEndTime(schedule.end_time.slice(0, 5));
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedCourse || selectedDay === '' || !startTime || !endTime) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    if (startTime >= endTime) {
      toast({ title: 'End time must be after start time', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingSchedule) {
        const { error } = await supabase
          .from('schedules')
          .update({
            course_id: selectedCourse,
            day_of_week: Number(selectedDay),
            start_time: startTime,
            end_time: endTime,
          })
          .eq('id', editingSchedule.id);

        if (error) throw error;
        toast({ title: 'Schedule updated successfully!' });
      } else {
        const { error } = await supabase
          .from('schedules')
          .insert({
            course_id: selectedCourse,
            day_of_week: Number(selectedDay),
            start_time: startTime,
            end_time: endTime,
          });

        if (error) throw error;
        toast({ title: 'Schedule added successfully!' });
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('schedules').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Schedule deleted' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const getDayLabel = (day: number) => {
    const d = DAYS.find((dd) => dd.value === day);
    return d ? `${d.labelAr} (${d.label})` : String(day);
  };

  // Group schedules by day
  const groupedByDay = DAYS.map((day) => ({
    ...day,
    schedules: schedules.filter((s) => s.day_of_week === day.value),
  })).filter((d) => d.schedules.length > 0);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="w-7 h-7 text-primary" />
            Schedule Management
          </h1>
          <p className="text-muted-foreground">Manage class schedules for your courses</p>
        </div>
        <Button onClick={openAddDialog} disabled={courses.length === 0}>
          <Plus className="w-4 h-4 mr-2" />
          Add Schedule
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Courses Yet</h3>
            <p className="text-muted-foreground">Create a course first to add schedules</p>
          </CardContent>
        </Card>
      ) : schedules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Schedules Yet</h3>
            <p className="text-muted-foreground mb-4">Add your first class schedule</p>
            <Button onClick={openAddDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Schedule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedByDay.map((day) => (
            <Card key={day.value}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    {day.labelAr}
                  </Badge>
                  <span className="text-muted-foreground text-sm font-normal">{day.label}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Age Group</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {day.schedules.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell className="font-medium">
                          {schedule.course?.title || 'Unknown Course'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{schedule.course?.age_group}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            {formatTime(schedule.start_time)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            {formatTime(schedule.end_time)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(schedule)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(schedule.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Weekly Overview */}
      {schedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Overview</CardTitle>
            <CardDescription>Total: {schedules.length} class sessions per week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map((day) => {
                const daySchedules = schedules.filter((s) => s.day_of_week === day.value);
                return (
                  <div
                    key={day.value}
                    className={`rounded-lg border p-3 text-center ${
                      daySchedules.length > 0 ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                    }`}
                  >
                    <p className="text-xs font-medium text-muted-foreground">{day.label.slice(0, 3)}</p>
                    <p className="text-sm font-bold mt-1">{day.labelAr}</p>
                    <p className="text-lg font-bold mt-1 text-primary">{daySchedules.length}</p>
                    <p className="text-xs text-muted-foreground">
                      {daySchedules.length === 1 ? 'class' : 'classes'}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}</DialogTitle>
            <DialogDescription>
              {editingSchedule ? 'Update the class schedule details' : 'Set a class time for one of your courses'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title} ({course.age_group})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day.value} value={String(day.value)}>
                      {day.labelAr} ({day.label})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !selectedCourse || selectedDay === '' || !startTime || !endTime}
              className="w-full"
            >
              {submitting
                ? 'Saving...'
                : editingSchedule
                ? 'Update Schedule'
                : 'Add Schedule'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScheduleManagement;
