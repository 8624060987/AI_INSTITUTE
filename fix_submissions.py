import re

with open("src/context/DatabaseContext.tsx", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# 1. Fetch assignment submissions in initAuth
fetch_block = """
        // Fetch test submissions
        const { data: submissionsData } = await supabase.from('test_submissions').select('*');
        if (submissionsData && submissionsData.length > 0) {
          setTestSubmissions(submissionsData.map(s => ({
            id: s.id,
            testId: s.test_id,
            studentId: s.student_id,
            score: s.score,
            answers: s.answers || {},
            submittedAt: s.submitted_at,
          })));
        }

        // Fetch assignment submissions
        const { data: assignmentSubmissionsData } = await supabase.from('assignment_submissions').select('*');
        if (assignmentSubmissionsData && assignmentSubmissionsData.length > 0) {
          setSubmissions(assignmentSubmissionsData.map(s => ({
            id: s.id,
            assignmentId: s.assignment_id,
            studentId: s.student_id,
            fileUrl: s.file_url,
            status: s.status as 'submitted' | 'evaluated',
            score: s.score || undefined,
            feedback: s.feedback || undefined,
            submittedAt: s.submitted_at,
            evaluatedAt: s.evaluated_at || undefined,
          })));
        }
"""
content = re.sub(
    r"\s*// Fetch test submissions.*?\}\)\)\);\s*\}",
    fetch_block,
    content,
    flags=re.DOTALL
)

# 2. Update submitAssignment
submit_old = """  const submitAssignment = (assignmentId: string, fileUrl: string) => {
    const newSubmission: AssignmentSubmission = {
      id: `sub_${Math.random().toString(36).substring(7)}`,
      assignmentId,
      studentId: currentUser.id,
      fileUrl,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };
    const updated = [newSubmission, ...submissions.filter(s => !(s.assignmentId === assignmentId && s.studentId === currentUser.id))];
    setSubmissions(updated);
    save('lms_submissions', updated);"""

submit_new = """  const submitAssignment = async (assignmentId: string, fileUrl: string) => {
    const newSubmission: AssignmentSubmission = {
      id: `sub_${Math.random().toString(36).substring(7)}`,
      assignmentId,
      studentId: currentUser.id,
      fileUrl,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };
    const updated = [newSubmission, ...submissions.filter(s => !(s.assignmentId === assignmentId && s.studentId === currentUser.id))];
    setSubmissions(updated);
    save('lms_submissions', updated);

    // Sync to Supabase
    const supabase = createClient();
    await supabase.from('assignment_submissions').upsert({
      assignment_id: assignmentId,
      student_id: currentUser.id,
      file_url: fileUrl,
      status: 'submitted',
      submitted_at: newSubmission.submittedAt
    }, { onConflict: 'assignment_id,student_id' });"""

content = content.replace(submit_old, submit_new)

# 3. Update evaluateSubmission to also save to Supabase
eval_old = """  const evaluateSubmission = (submissionId: string, score: number, feedback: string) => {
    setSubmissions(prev => {
      return prev.map(sub => {"""

eval_new = """  const evaluateSubmission = async (submissionId: string, score: number, feedback: string) => {
    setSubmissions(prev => {
      return prev.map(sub => {"""

content = content.replace(eval_old, eval_new)

eval_end_old = """        return { ...sub, status: 'evaluated' as const, score, feedback, evaluatedAt: new Date().toISOString() };
      }
    });
  };"""

eval_end_new = """        const evaluatedAt = new Date().toISOString();
        
        // Async update to Supabase (fire and forget inside map is bad, but we can do it asynchronously here)
        const supabase = createClient();
        supabase.from('assignment_submissions').update({
          status: 'evaluated',
          score,
          feedback,
          evaluated_at: evaluatedAt
        }).eq('assignment_id', sub.assignmentId).eq('student_id', sub.studentId).then();

        return { ...sub, status: 'evaluated' as const, score, feedback, evaluatedAt };
      }
    });
  };"""
content = content.replace(eval_end_old, eval_end_new)


with open("src/context/DatabaseContext.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated DatabaseContext.tsx")
