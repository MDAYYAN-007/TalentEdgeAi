# TalentEdge HRMS

A modern AI-powered hiring platform that streamlines recruitment with automated resume scoring, interview scheduling, and candidate assessment.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (Supabase)
- Environment variables (see below)

### Installation
```bash
npm install
npm run dev
```

### Environment Setup
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
GEMINI_API_KEY="google-ai-key"
AFFINDA_API_KEY="affinda-api-key"
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="app-password"
```

## 🛠 Tech Stack
- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js Server Actions
- **Database**: PostgreSQL (Supabase)
- **AI**: Google Gemini (scoring), Affinda (resume parsing)
- **Auth**: JWT with HTTP-only cookies
- **Email**: Nodemailer
- **Deployment**: Vercel

## 👥 User Roles
- **User**: Job seekers, apply to jobs, track applications
- **HR**: Manage applications, schedule interviews, assign tests
- **SeniorHR**: Extended HR privileges
- **OrgAdmin**: Full organization management

## 📱 Key Pages

### Public Routes
- `/` - Landing page
- `/signin`, `/signup`, `/verify` - Authentication
- `/jobs` - Browse job listings
- `/jobs/[id]` - Job details

### Candidate Routes
- `/dashboard` - Personal dashboard
- `/applications` - My applications
- `/interviews` - Interview schedule
- `/tests` - Assessment tests
- `/profile` - Profile management

### Organization Routes
- `/organization/dashboard` - Analytics
- `/organization/jobs` - Job management
- `/organization/applications` - Candidate pipeline
- `/organization/tests` - Test library
- `/create-job`, `/create-test` - Content creation

## 🔧 Core Features

### 🤖 AI-Powered Hiring
- **Resume Scoring**: Google Gemini analyzes resumes against job requirements
- **Resume Parsing**: Affinda extracts structured data from resumes
- **Test Evaluation**: AI grading for subjective questions

### 📊 Application Management
- Complete ATS with status tracking
- AI scoring with improvement suggestions
- Interview scheduling integrated

### 🧪 Assessment Platform
- Create custom tests with various question types
- Automated proctoring and violation tracking
- Real-time test taking interface

### 👥 Team Collaboration
- Role-based access control
- HR team assignment to jobs
- Collaborative candidate evaluation

## 🗄 Database Overview
Core tables: `users`, `organizations`, `jobs`, `applications`, `interviews`, `tests`, `test_attempts`, `profiles`

## 🚀 Deployment
1. Connect GitHub repo to Vercel
2. Add environment variables
3. Deploy automatically

## 🎯 Demo Flow

### Candidate Demo
1. Sign up → Complete profile → Browse jobs
2. Apply with resume → Get AI score → Track status
3. Take tests → Schedule interviews → Get hired

### HR Demo  
1. Access org dashboard → Review applications
2. AI-scored candidate ranking → Schedule interviews
3. Assign tests → Make hiring decisions

---

**Built for modern hiring needs** • [Live Demo](your-vercel-url) • [Report Issue](issues-url)
