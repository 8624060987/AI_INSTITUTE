import re

def update_page():
    with open('src/app/portal/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add state and useEffect for fetching batch enrollments
    state_decl = "  const [mentorSelectedCourseId, setMentorSelectedCourseId] = useState<string>('course-ds');"
    
    new_state_and_effect = """  const [mentorSelectedCourseId, setMentorSelectedCourseId] = useState<string>('course-ds');
  const [batchEnrolledCount, setBatchEnrolledCount] = useState<number>(0);

  // Fetch real enrolled student count for the mentor's selected batch
  useEffect(() => {
    if (currentUser?.role !== 'mentor' || !mentorSelectedCourseId) return;
    
    const fetchEnrollments = async () => {
      const supabase = createClient();
      const { count } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', mentorSelectedCourseId);
      
      setBatchEnrolledCount(count || 0);
    };
    
    fetchEnrollments();
  }, [mentorSelectedCourseId, currentUser]);
"""
    content = content.replace(state_decl, new_state_and_effect)

    # 2. Update the stat card
    old_card = "{ title: 'Total Students', val: leaderboard.length.toLocaleString(), label: 'Total Enrolled' },"
    new_card = "{ title: 'Total Students', val: batchEnrolledCount.toLocaleString(), label: 'In Selected Batch' },"
    content = content.replace(old_card, new_card)

    with open('src/app/portal/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

update_page()
print("Updated Mentor Total Students Card!")
