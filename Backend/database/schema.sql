-- ============================================================================
-- EduNovaAI - Supabase PostgreSQL Schema
-- Student-only application schema
-- Fresh database: NO demo users, NO demo progress, NO demo history.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USERS - custom EduNovaAI authentication records
-- ============================================================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Email verification
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_code_hash TEXT,
    verification_expires_at TIMESTAMPTZ,

    -- Password reset
    reset_token TEXT,
    reset_token_expires_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_reset_token ON public.users(reset_token);

-- ============================================================================
-- 2. STUDENTS - one profile per registered user
-- ============================================================================
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    grade_level VARCHAR(100) DEFAULT 'University / Higher Ed',
    school_or_college VARCHAR(255),
    learning_style VARCHAR(100) DEFAULT 'Visual & Socratic',
    cognitive_pace VARCHAR(50) DEFAULT '1.2x Active',
    preferred_language VARCHAR(100) DEFAULT 'English',
    streak_days INTEGER NOT NULL DEFAULT 0,
    total_xp INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_students_user_id ON public.students(user_id);

-- ============================================================================
-- 3. COURSES - optional learning content
-- No teacher/human-teacher relationship is used.
-- ============================================================================
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(100) DEFAULT 'Undergraduate',
    description TEXT,
    thumbnail_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_courses_published ON public.courses(is_published);

-- ============================================================================
-- 4. ENROLLMENTS - created only when a student actually starts/enrolls
-- ============================================================================
CREATE TABLE public.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    mastery_score INTEGER NOT NULL DEFAULT 0 CHECK (mastery_score BETWEEN 0 AND 100),
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'completed', 'paused')),
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, course_id)
);

CREATE INDEX idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_course ON public.enrollments(course_id);

-- ============================================================================
-- 5. LESSONS - optional/generated learning content
-- ============================================================================
CREATE TABLE public.lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    curriculum_standard VARCHAR(100) DEFAULT 'University STEM',
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    summary TEXT,
    order_index INTEGER NOT NULL DEFAULT 1,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lessons_course_id ON public.lessons(course_id);

-- ============================================================================
-- 6. QUIZZES
-- ============================================================================
CREATE TABLE public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    difficulty VARCHAR(50) NOT NULL DEFAULT 'adaptive'
        CHECK (difficulty IN ('easy', 'medium', 'hard', 'adaptive')),
    time_limit_mins INTEGER NOT NULL DEFAULT 15,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quizzes_lesson ON public.quizzes(lesson_id);
CREATE INDEX idx_quizzes_course ON public.quizzes(course_id);

-- ============================================================================
-- 7. QUIZ QUESTIONS
-- ============================================================================
CREATE TABLE public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_option_index INTEGER NOT NULL CHECK (correct_option_index >= 0 AND correct_option_index <= 3),
    distractor_misconceptions JSONB NOT NULL DEFAULT '{}'::jsonb,
    difficulty_level VARCHAR(50) NOT NULL DEFAULT 'medium'
        CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    explanation TEXT,
    order_index INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);

-- ============================================================================
-- 8. QUIZ SUBMISSIONS - actual student activity only
-- quiz_id is nullable because the current frontend can use AI/fallback quiz
-- questions that do not exist as a stored quiz row yet.
-- ============================================================================
CREATE TABLE public.quiz_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
    score INTEGER NOT NULL CHECK (score >= 0),
    total_questions INTEGER NOT NULL CHECK (total_questions > 0),
    percentage NUMERIC(5,2) NOT NULL CHECK (percentage BETWEEN 0 AND 100),
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    detected_misconceptions JSONB NOT NULL DEFAULT '[]'::jsonb,
    feedback TEXT,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_submissions_student ON public.quiz_submissions(student_id);
CREATE INDEX idx_quiz_submissions_quiz ON public.quiz_submissions(quiz_id);

-- ============================================================================
-- 9. AI TUTOR CHAT - actual conversations only
-- ============================================================================
CREATE TABLE public.ai_tutor_chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    topic VARCHAR(255) DEFAULT 'General Learning',
    tutor_mode VARCHAR(50) NOT NULL DEFAULT 'socratic'
        CHECK (tutor_mode IN ('socratic', 'first_principles', 'eli5', 'feynman')),
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'ai')),
    message TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_chats_student ON public.ai_tutor_chats(student_id);

-- ============================================================================
-- 10. LEARNING ANALYTICS - created/updated only by actual learning activity
-- ============================================================================
CREATE TABLE public.learning_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    mastery_score INTEGER NOT NULL DEFAULT 0 CHECK (mastery_score BETWEEN 0 AND 100),
    misconceptions_count INTEGER NOT NULL DEFAULT 0,
    last_reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, topic)
);

CREATE INDEX idx_analytics_student ON public.learning_analytics(student_id);

-- ============================================================================
-- 11. STUDY GOALS
-- ============================================================================
CREATE TABLE public.study_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    due_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed', 'in_progress')),
    priority VARCHAR(50) NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_study_goals_student ON public.study_goals(student_id);

-- ============================================================================
-- 12. ROW LEVEL SECURITY
-- Backend uses the Supabase service key, so these policies protect against
-- accidental direct client access while backend operations continue to work.
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tutor_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_goals ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Students
CREATE POLICY "Students can view their own profile"
    ON public.students FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Students can update their own profile"
    ON public.students FOR UPDATE
    USING (auth.uid() = user_id);

-- Public learning content is readable; writes are performed by the backend.
CREATE POLICY "Anyone can view published courses"
    ON public.courses FOR SELECT
    USING (is_published = TRUE);

CREATE POLICY "Anyone can view published lessons"
    ON public.lessons FOR SELECT
    USING (is_published = TRUE);

CREATE POLICY "Authenticated users can view quizzes"
    ON public.quizzes FOR SELECT
    USING (TRUE);

CREATE POLICY "Authenticated users can view quiz questions"
    ON public.quiz_questions FOR SELECT
    USING (TRUE);

-- Student-owned activity
CREATE POLICY "Students can manage their own enrollments"
    ON public.enrollments FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can manage their own quiz submissions"
    ON public.quiz_submissions FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can manage their own tutor chats"
    ON public.ai_tutor_chats FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view their own analytics"
    ON public.learning_analytics FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Students can manage their own study goals"
    ON public.study_goals FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

-- ============================================================================
-- IMPORTANT: No INSERT statements are intentionally included.
-- A fresh account therefore starts with zero progress/history and no demo data.
-- ============================================================================
