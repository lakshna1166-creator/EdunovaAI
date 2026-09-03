export const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Features', path: '/features' },
  { label: 'How It Works', path: '/how-it-works' },
  { label: 'Student Journey', path: '/student' }
];

export const heroStats = [
  { label: 'Misconception Accuracy', value: '99.4%' },
  { label: 'Personalized Lesson Paths', value: '100%' },
  { label: 'Avg Retention Boost', value: '3.8x' },
  { label: 'Supported Languages', value: '32+' }
];

export const howItWorksSteps = [
  {
    step: '01',
    title: 'Enter Topic OR Upload Material',
    description: 'Provide any topic keyword, syllabus, lecture notes, textbook PDF, or assignment prompt. EduNovaAI instantly ingests and structures the content.',
    badge: 'Input Phase',
    icon: 'FileText',
    color: '#6366F1',
    details: ['PDF & doc ingestion', 'Custom topic synthesis', 'Curriculum alignment']
  },
  {
    step: '02',
    title: 'AI Builds Learning Profile',
    description: 'Our cognitive engine analyzes your prior mastery, cognitive pace, weak prerequisite areas, and preferred explanation style (visual, conceptual, mathematical).',
    badge: 'Cognitive Modeling',
    icon: 'Brain',
    color: '#8B5CF6',
    details: ['Prerequisite mapping', 'Cognitive pace tuning', 'Dynamic baseline check']
  },
  {
    step: '03',
    title: 'Personalized Lesson Generation',
    description: 'Generates a custom multi-modal lesson structured with core principles, mental models, real-world analogies, and interactive check-ins.',
    badge: 'Dynamic Curriculum',
    icon: 'Sparkles',
    color: '#06B6D4',
    details: ['Modular micro-lessons', 'Analogy-rich breakdowns', 'Targeted depth control']
  },
  {
    step: '04',
    title: 'AI Teacher Interactive Session',
    description: 'Engage in a 1-on-1 dialogue with your AI tutor. Ask questions naturally, solve problems step-by-step, and receive instant Socratic hints.',
    badge: 'Socratic Dialogue',
    icon: 'Bot',
    color: '#10B981',
    details: ['24/7 Socratic guidance', 'Voice & text interaction', 'Step-by-step hints']
  },
  {
    step: '05',
    title: 'Adaptive Learning & Misconception Fix',
    description: 'When you make a mistake, EduNovaAI detects the underlying misconception in real-time, pauses, and re-teaches the foundation using alternate mental models.',
    badge: 'Real-Time Adaptation',
    icon: 'RefreshCw',
    color: '#F59E0B',
    details: ['Root-cause analysis', 'Adaptive re-explanation', 'Targeted remediation']
  },
  {
    step: '06',
    title: 'Learning Report & Next Topic',
    description: 'Receive an in-depth mastery analytics report detailing strengths, conquered misconceptions, retention score, and recommended next concepts.',
    badge: 'Mastery & Growth',
    icon: 'TrendingUp',
    color: '#EC4899',
    details: ['Knowledge graph update', 'Retention forecast', 'Curated next topics']
  }
];

export const aiFeatures = [
  {
    id: 'personalized-learning',
    title: 'Personalized Learning',
    description: 'No two learners are identical. EduNovaAI builds an individualized cognitive trajectory matching your pace, depth, and learning style.',
    icon: 'UserCheck',
    color: '#6366F1',
    tag: 'Core Engine'
  },
  {
    id: 'rag-knowledge',
    title: 'RAG-based Knowledge',
    description: 'Grounded in uploaded documents, textbooks, and verified academic sources with zero hallucination and verifiable citations.',
    icon: 'Database',
    color: '#06B6D4',
    tag: 'Fact-Grounded'
  },
  {
    id: 'ai-teacher',
    title: '24/7 Interactive AI Teacher',
    description: 'An empathetic, patient AI tutor that guides through Socratic questioning rather than just handing out rote answers.',
    icon: 'MessageSquareText',
    color: '#8B5CF6',
    tag: 'Socratic Tutor'
  },
  {
    id: 'misconception-detection',
    title: 'Misconception Detection',
    description: 'Instantly pinpoints why you got a question wrong, distinguishing between computational slip-ups and fundamental cognitive flaws.',
    icon: 'ShieldAlert',
    color: '#F43F5E',
    tag: 'Precision AI'
  },
  {
    id: 'adaptive-difficulty',
    title: 'Adaptive Difficulty',
    description: 'Dynamically shifts problem complexity up or down in real time based on response confidence and mastery velocity.',
    icon: 'Sliders',
    color: '#F59E0B',
    tag: 'Flow State'
  },
  {
    id: 'multilingual',
    title: 'Multi-language Learning',
    description: 'Seamlessly switch explanations, terminology, and teacher dialogue across 32+ global languages without loss of academic precision.',
    icon: 'Globe',
    color: '#10B981',
    tag: 'Global Access'
  },
  {
    id: 'ai-quiz',
    title: 'AI Diagnostic & Final Quiz',
    description: 'Generates non-repetitive contextual quizzes, scenario-based dilemmas, and interactive coding or mathematical checks.',
    icon: 'CheckCircle2',
    color: '#A855F7',
    tag: 'Smart Assessment'
  },
  {
    id: 'learning-analytics',
    title: 'Deep Learning Analytics',
    description: 'Comprehensive mastery graphs, retention curves, cognitive velocity tracking, and personalized weakness heatmaps.',
    icon: 'BarChart3',
    color: '#38BDF8',
    tag: 'Insights'
  }
];

export const footerLinks = {
  product: [
    { label: 'Features', path: '/features' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'Student Journey', path: '/student' }
  ],
  studentSuite: [
    { label: 'Student Dashboard', path: '/dashboard' },
    { label: 'Learning Setup', path: '/learning-setup' },
    { label: 'My Progress', path: '/progress' },
    { label: 'Learning History', path: '/history' },
    { label: 'AI Tutor Session', path: '/student/teacher' }
  ],
  account: [
    { label: 'Student Login', path: '/login' },
    { label: 'Create Account', path: '/signup' },
    { label: 'Forgot Password', path: '/forgot-password' }
  ]
};
