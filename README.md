# TalentEdge HR Management System

A modern, AI-powered HR management platform that streamlines the entire hiring process from job posting to candidate onboarding. Built with Next.js 14 and featuring AI resume scoring, automated interviews, and comprehensive candidate management.

## 🚀 Features

### 🤖 AI-Powered Capabilities
- **Resume Scoring**: Google Gemini AI analyzes resumes against job requirements
- **Resume Parsing**: Affinda API extracts structured data from resumes
- **AI Test Evaluation**: Automated test scoring with AI analysis

### 👥 Multi-Role Platform
- **Job Seekers**: Browse jobs, apply, track applications, take tests
- **HR Teams**: Manage applications, schedule interviews, assign tests
- **Organization Admins**: Full system control, analytics, team management

### 📊 Comprehensive Modules
- Job Management & Posting
- Application Tracking System (ATS)
- Interview Scheduling & Management
- Assessment Test Platform
- Real-time Analytics Dashboard

## 🛠 Technology Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js Server Actions
- **Database**: PostgreSQL (Supabase)
- **AI/ML**: Google Gemini, Affinda Resume Parser
- **Authentication**: JWT with HTTP-only cookies
- **Email**: Nodemailer with SMTP
- **Deployment**: Vercel

## 📁 Project Structure

### Actions Documentation

#### 🔐 Authentication Actions (`/actions/auth/`)

**`auth.js`**
- Handles user authentication and session management
- Validates JWT tokens and manages user sessions

**`signup.js`**
- Registers new users with email verification
- Generates OTP and sends verification emails
- Stores temporary user data in `otp_temp` table

**`signin.js`**
- Authenticates users with email and password
- Creates JWT tokens and sets HTTP-only cookies
- Handles role-based access control

**`verify.js`**
- Verifies OTP codes for email confirmation
- Moves users from `otp_temp` to permanent `users` table
- Creates initial user profile

**`resend-otp.js`**
- Generates new OTP and resends verification email
- Updates expiration time in database

**`logout.js`**
- Clears authentication cookies and ends user session

**`updateToken.js`**
- Refreshes JWT tokens for extended sessions
- Validates token expiration and issues new tokens

**`protect-page.js`**
- Server-side page protection middleware
- Redirects unauthorized users based on roles

**`auth-utils.js`**
- Utility functions for authentication
- Token validation and user role checking

#### 💼 Applications Actions (`/actions/applications/`)

**`checkApplication.js`**
- Checks if user has already applied to a specific job
- Prevents duplicate applications

**`getApplicationDetails.js`**
- Fetches complete application details including job and company info
- Returns AI scoring data and feedback

**`getApplicationStatusHistory.js`**
- Retrieves application status change history
- Tracks application progression timeline

**`getJobApplications.js`**
- Gets all applications for a specific job (HR view)
- Includes filtering and pagination

**`getJobApplicationStats.js`**
- Calculates application statistics for jobs
- Counts by status, completion rates, etc.

**`getRecruiterApplicationDetails.js`**
- Fetches application details for HR/recruiter view
- Includes candidate contact information

**`getRecruiterApplications.js`**
- Gets applications assigned to specific recruiter
- Role-based application filtering

**`getUserApplications.js`**
- Retrieves all applications for a candidate
- Personal application tracking

**`scoreResume.js`**
- AI-powered resume scoring using Google Gemini
- Calculates objective and subjective scores
- Provides improvement suggestions

**`submitApplication.js`**
- Processes new job applications
- Handles resume upload and parsing
- Triggers AI scoring automatically

**`updateApplicationStatus.js`**
- Updates application status (HR action)
- Tracks status changes in history

#### 📊 Dashboard Actions (`/actions/dashboard/`)

**`getOrganizationDashboardData.js`**
- Fetches analytics for organization admin
- Application statistics, job metrics, team performance

**`getUserDashboardData.js`**
- Gets personalized dashboard data for candidates
- Application status, upcoming interviews, test assignments

#### 🗄 Database Actions (`/actions/db.js`)
- PostgreSQL connection pool management
- Query execution with error handling
- SSL configuration for Supabase

#### 💬 Interviews Actions (`/actions/interviews/`)

**`getApplicantInterviews.js`**
- Retrieves all interviews for a candidate
- Includes timing, status, and interviewer details

**`getAvailableInterviewers.js`**
- Fetches available HR team members for scheduling
- Checks interviewer availability

**`getInterviewForApplication.js`**
- Gets scheduled interview for specific application
- Application-interview relationship management

**`getInterviewsForApplication.js`**
- Retrieves interview history for an application
- Multiple interview rounds tracking

**`rescheduleInterview.js`**
- Updates interview timing and details
- Notifies participants of changes

**`scheduleInterview.js`**
- Creates new interview sessions
- Handles calendar conflicts and availability

**`updateInterviewStatus.js`**
- Updates interview status (scheduled, completed, cancelled)
- Tracks interview outcomes

#### 💼 Jobs Actions (`/actions/jobs/`)

**`createJob.js`**
- Creates new job postings
- Sets job requirements and details

**`deleteJob.js`**
- Archives or removes job postings
- Handles application dependencies

**`getJobDetails.js`**
- Fetches complete job information (HR view)
- Includes internal job data

**`getPublicJobDetails.js`**
- Retrieves job details for public/candidate view
- Excludes sensitive internal information

**`getPublicJobs.js`**
- Gets published jobs for job seekers
- Search and filter capabilities

**`getRecruiters.js`**
- Fetches HR team members for job assignment
- Role-based recruiter listing

**`updateJob.js`**
- Modifies existing job postings
- Version control for job changes

**`updateJobRecruiters.js`**
- Assigns recruiters to manage specific jobs
- Team allocation management

**`updateJobStatus.js`**
- Changes job status (active, paused, closed)
- Controls job visibility

#### 🏢 Organization Actions (`/actions/organization/`)

**`create-organization.js`**
- Creates new organization accounts
- Sets up company profiles and admin users

**`getJobs.js`**
- Retrieves all jobs for an organization
- Organization-specific job management

**`getOrganizationData.js`**
- Fetches company profile and settings
- Organization-level configuration

#### 👤 Profile Actions (`/actions/profile/`)

**`getProfile.js`**
- Retrieves user profile information
- Personal and professional details

**`saveProfile.js`**
- Updates user profile data
- Handles profile completion and validation

#### 📄 Resume Actions (`/actions/resume/parseResume.js`)
- Integrates with Affinda API for resume parsing
- Extracts structured data from resume files
- Normalizes resume information for system use

#### 🧪 Tests Actions (`/actions/tests/`)

**`assignMultipleTestsToApplicant.js`**
- Assigns multiple tests to candidates in bulk
- Batch test assignment for efficiency

**`assignTestToApplicants.js`**
- Assigns specific tests to selected applicants
- Individual test assignment

**`createTest.js`**
- Creates new assessment tests
- Configures questions, timing, and scoring

**`evaluateTestAttempt.js`**
- Automatically scores test attempts
- Calculates results and performance metrics

**`evaluateWithAI.js`**
- AI-powered evaluation for subjective questions
- Uses Gemini for complex answer analysis

**`getApplicantTestDetails.js`**
- Fetches detailed test information for candidates
- Test instructions and requirements

**`getApplicantTests.js`**
- Retrieves all tests assigned to a candidate
- Test status and completion tracking

**`getApplicantsForTestAssignment.js`**
- Gets candidate list for test assignment
- Filtering by application status

**`getOrganizationTests.js`**
- Fetches all tests created by an organization
- Test library management

**`getTestAttemptId.js`**
- Generates unique attempt IDs for test taking
- Ensures test attempt tracking

**`getTestDeatils.js`**
- Retrieves complete test configuration
- Question bank and settings

**`getTestQuestions.js`**
- Fetches questions for test taking
- Randomization and sequencing

**`getTestResults.js`**
- Retrieves test results and analytics
- Performance reports and insights

**`getTestsForApplication.js`**
- Gets tests assigned to specific application
- Application-test relationship

**`rescheduleTest.js`**
- Updates test deadlines and timing
- Manages test scheduling changes

**`setTestActive.js`**
- Activates tests for candidate access
- Controls test availability

**`setTestInactive.js`**
- Deactivates tests
- Prevents further attempts

**`startTestAttempt.js`**
- Initiates test taking session
- Sets up timing and proctoring

**`submitTestAttempt.js`**
- Finalizes test submission
- Calculates final scores

**`submitTestResponse.js`**
- Saves individual question responses
- Real-time answer tracking

**`updateProctoringViolation.js`**
- Records proctoring violations during tests
- Security and integrity monitoring

**`updateTestMarks.js`**
- Manual score adjustment by HR
- Override automated scoring when needed

## 🌐 Pages Documentation

### Public Pages

**`app/page.js`** - Landing Page
- Platform introduction and feature showcase
- Call-to-action for job seekers and employers
- Public access

**`app/signup/page.js`** - User Registration
- New user account creation
- Email verification with OTP
- Role selection (User/HR/OrgAdmin)

**`app/signin/page.js`** - User Login
- Authentication form
- Password recovery options
- Redirects based on user role

**`app/verify/page.js`** - Email Verification
- OTP input and validation
- Account activation
- Automatic profile creation

**`app/jobs/page.js`** - Job Listings
- Public job search and browsing
- Filtering by location, type, experience
- Job card displays with key details

**`app/jobs/[jobId]/page.js`** - Job Details
- Comprehensive job information
- Company profile and requirements
- Apply button for authenticated users

### Candidate Pages

**`app/dashboard/page.js`** - User Dashboard
- Personal application statistics
- Upcoming interviews and tests
- Quick actions and notifications

**`app/jobs/[jobId]/apply/page.js`** - Job Application
- Application form with resume upload
- AI resume parsing and preview
- Cover letter submission

**`app/applications/page.js`** - My Applications
- Application history and status tracking
- Filter by status (pending, reviewed, rejected)
- Quick access to application details

**`app/applications/[applicationId]/page.js`** - Application Details
- Detailed application view
- AI scoring results and feedback
- Interview and test status

**`app/interviews/page.js`** - My Interviews
- Interview schedule and history
- Join links and preparation materials
- Status updates

**`app/tests/page.js`** - My Tests
- Assigned test listings
- Test status and deadlines
- Start test functionality

**`app/tests/[testAssignmentId]/page.js`** - Test Taking
- Full test interface with timer
- Question navigation and submission
- Proctoring indicators

**`app/profile/page.js`** - Profile View
- Personal and professional information
- Skills and experience display
- Application statistics

**`app/profile/edit/page.js`** - Profile Editor
- Editable profile form
- Resume upload and parsing
- Skill management

### Organization Pages

**`app/create-organization/page.js`** - Organization Setup
- Company registration for first-time admins
- Initial setup and configuration

**`app/organization/dashboard/page.js`** - Org Dashboard
- Comprehensive analytics and metrics
- Team performance overview
- Recent activity feed

**`app/organization/jobs/page.js`** - Job Management
- All organization job postings
- Create new job functionality
- Job status management

**`app/organization/jobs/[jobId]/page.js`** - Job Editor
- Job details and requirements editing
- Recruiter assignment
- Application statistics

**`app/organization/jobs/[jobId]/applications/page.js`** - Job Applications
- All applications for specific job
- Filtering and sorting options
- Bulk actions

**`app/organization/applications/page.js`** - All Applications
- Organization-wide application management
- Advanced filtering and search
- HR team assignment

**`app/organization/applications/[applicationId]/page.js`** - Application Management
- Detailed candidate evaluation
- Interview scheduling
- Status updates and notes

**`app/organization/applications/[applicationId]/result/[attemptId]/page.js`** - Test Results
- Detailed test performance analysis
- AI evaluation insights
- Candidate comparison

**`app/organization/tests/page.js`** - Test Library
- Organization's test catalog
- Test creation and management
- Usage analytics

**`app/organization/tests/[testId]/page.js`** - Test Editor
- Test configuration and questions
- Settings and timing adjustments
- Result analysis

**`app/organization/tests/[testId]/assign/page.js`** - Test Assignment
- Bulk test assignment interface
- Candidate selection and filtering
- Deadline management

**`app/organization/create-job/page.js`** - Job Creation
- New job posting form
- Requirement specification
- Publishing controls

**`app/organization/create-test/page.js`** - Test Creation
- Assessment test builder
- Question bank management
- Scoring configuration

## 🗄 Database Schema

### Core Tables
- `users` - User accounts and authentication
- `organizations` - Company profiles
- `jobs` - Job postings and requirements
- `applications` - Job applications
- `application_status_history` - Application status tracking
- `interviews` - Interview scheduling
- `tests` - Assessment tests
- `test_assignments` - Test-candidate relationships
- `test_attempts` - Test taking sessions
- `test_questions` - Question bank
- `test_responses` - Candidate answers
- `profiles` - User profile information
- `otp_temp` - Temporary OTP storage

## ⚙️ Environment Setup

### Required Environment Variables
```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# AI Services
GEMINI_API_KEY="your-google-gemini-key"
AFFINDA_API_KEY="your-affinda-api-key"

# Email Service
SMTP_HOST="your-smtp-host"
SMTP_PORT="465"
SMTP_USER="your-email@domain.com"
SMTP_PASS="your-smtp-password"