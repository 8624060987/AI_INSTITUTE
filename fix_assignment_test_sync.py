import re

with open("src/context/DatabaseContext.tsx", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# Replace addAssignment
old_add_assignment = """  // Assignments operations
  const addAssignment = async (assignmentData: Omit<Assignment, 'id'>) => {
    const id = `assignment-${Math.random().toString(36).substring(7)}`;
    const newAssignment: Assignment = { ...assignmentData, id };
    
    // Sync to Supabase if authenticated
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('assignments').insert({
        course_id: assignmentData.courseId,
        title: assignmentData.title,
        description: assignmentData.description,
        file_url: assignmentData.fileUrl || '#',
        due_date: assignmentData.dueDate,
        points: assignmentData.points
      });
    }

    setAssignments(prev => {
      const u = [...prev, newAssignment];
      save('lms_assignments', u);
      return u;
    });
  };"""

new_add_assignment = """  // Assignments operations
  const addAssignment = async (assignmentData: Omit<Assignment, 'id'>) => {
    let realId = `assignment-${Math.random().toString(36).substring(7)}`;
    
    // Sync to Supabase if authenticated
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: assDb } = await supabase.from('assignments').insert({
        course_id: assignmentData.courseId,
        title: assignmentData.title,
        description: assignmentData.description,
        file_url: assignmentData.fileUrl || '#',
        due_date: assignmentData.dueDate,
        points: assignmentData.points
      }).select().single();

      if (assDb) {
        realId = assDb.id;
      }
    }

    const newAssignment: Assignment = { ...assignmentData, id: realId };

    setAssignments(prev => {
      const u = [...prev, newAssignment];
      save('lms_assignments', u);
      return u;
    });
  };"""

content = content.replace(old_add_assignment, new_add_assignment)

# Replace createTest
old_create_test = """  // Tests & Quizzes operations
  const createTest = async (
    testData: Omit<Test, 'id' | 'totalQuestions' | 'totalPoints'>,
    questionsList: Omit<Question, 'id' | 'testId'>[]
  ) => {
    const testId = `test-${Math.random().toString(36).substring(7)}`;
    const totalPoints = questionsList.reduce((acc, q) => acc + q.points, 0);
    const totalQuestions = questionsList.length;

    const newTest: Test = {
      ...testData,
      id: testId,
      totalQuestions,
      totalPoints,
    };

    const newQuestions: Question[] = questionsList.map((q, idx) => ({
      ...q,
      id: `q-${Math.random().toString(36).substring(7)}`,
      testId,
      orderIndex: idx + 1,
    }));

    // Sync to Supabase if authenticated
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: testDb } = await supabase.from('tests').insert({
        course_id: testData.courseId,
        title: testData.title,
        description: testData.description,
        duration_minutes: testData.durationMinutes,
        total_questions: totalQuestions,
        total_points: totalPoints,
      }).select().single();

      if (testDb) {
        const dbQs = newQuestions.map(q => ({
          test_id: testDb.id,
          question_text: q.questionText,
          question_type: q.questionType,
          options: q.options,
          correct_answer: q.correctAnswer,
          points: q.points,
          order_index: q.orderIndex,
        }));
        await supabase.from('questions').insert(dbQs);
      }
    }

    setTests(prev => {
      const u = [...prev, newTest];
      save('lms_tests', u);
      return u;
    });

    setQuestions(prev => {
      const u = [...prev, ...newQuestions];
      save('lms_questions', u);
      return u;
    });
  };"""

new_create_test = """  // Tests & Quizzes operations
  const createTest = async (
    testData: Omit<Test, 'id' | 'totalQuestions' | 'totalPoints'>,
    questionsList: Omit<Question, 'id' | 'testId'>[]
  ) => {
    let realTestId = `test-${Math.random().toString(36).substring(7)}`;
    const totalPoints = questionsList.reduce((acc, q) => acc + q.points, 0);
    const totalQuestions = questionsList.length;
    let questionIdMap: Record<number, string> = {};

    // Sync to Supabase if authenticated
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: testDb } = await supabase.from('tests').insert({
        course_id: testData.courseId,
        title: testData.title,
        description: testData.description,
        duration_minutes: testData.durationMinutes,
        total_questions: totalQuestions,
        total_points: totalPoints,
      }).select().single();

      if (testDb) {
        realTestId = testDb.id;
        const dbQs = questionsList.map((q, idx) => ({
          test_id: testDb.id,
          question_text: q.questionText,
          question_type: q.questionType,
          options: q.options,
          correct_answer: q.correctAnswer,
          points: q.points,
          order_index: idx + 1,
        }));
        const { data: qsDb } = await supabase.from('questions').insert(dbQs).select();
        if (qsDb) {
          qsDb.forEach((insertedQ) => {
            questionIdMap[insertedQ.order_index] = insertedQ.id;
          });
        }
      }
    }

    const newTest: Test = {
      ...testData,
      id: realTestId,
      totalQuestions,
      totalPoints,
    };

    const newQuestions: Question[] = questionsList.map((q, idx) => ({
      ...q,
      id: questionIdMap[idx + 1] || `q-${Math.random().toString(36).substring(7)}`,
      testId: realTestId,
      orderIndex: idx + 1,
    }));

    setTests(prev => {
      const u = [...prev, newTest];
      save('lms_tests', u);
      return u;
    });

    setQuestions(prev => {
      const u = [...prev, ...newQuestions];
      save('lms_questions', u);
      return u;
    });
  };"""

content = content.replace(old_create_test, new_create_test)

with open("src/context/DatabaseContext.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated addAssignment & createTest for real UUID sync")
