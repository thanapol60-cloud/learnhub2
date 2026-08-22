# LearnHub Project Documentation

## Project Overview

LearnHub is an adaptive English proficiency assessment platform designed to evaluate learners' English levels using the CEFR (Common European Framework of Reference) standard and recommend personalized courses based on their proficiency level.

## Architecture

### Technology Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Prisma ORM with TiDB/MySQL
- **Hosting**: Vercel (frontend) + TiDB Cloud (database)

### Project Structure
```
learnhub2/
├── app/
│   ├── api/                    # API routes
│   │   ├── assessment/         # Assessment endpoints
│   │   ├── question/          # Question retrieval
│   │   ├── dashboard/         # Dashboard data
│   │   └── courses/           # Course recommendations
│   ├── assessment/            # Assessment page
│   ├── result/                # Results display
│   ├── dashboard/             # User dashboard
│   ├── courses/               # Courses listing
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   └── globals.css            # Global styles
├── lib/
│   ├── cefr.ts               # CEFR level utilities
│   ├── assessment.ts         # Assessment algorithm
│   ├── db.ts                 # Database singleton
│   └── ...
├── prisma/
│   └── schema.prisma         # Database schema
├── scripts/
│   ├── seed.ts              # Database seeding script
│   ├── seed-math.mjs        # คลังข้อสอบคณิตศาสตร์ M1–M6
│   ├── seed-science.mjs     # คลังข้อสอบวิทยาศาสตร์ S1–S6
│   ├── seed-stem-courses.mjs # คอร์สคณิต/วิทย์ พร้อมตรวจว่าครอบคลุมทุกหัวข้อ
│   └── seed-stem-students.mjs # ผู้เรียนสายวิทย์-คณิต + เติมระดับให้ผู้เรียนเดิม
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## Key Features

### 1. User Authentication & Authorization
- Register with role selection (User or Admin)
- Admin registration requires a verification code (`ADMIN_REGISTER_CODE`, default `LEARNHUB-ADMIN-2026`)
- Login with email and password
- Secure password hashing with PBKDF2
- Role-based access control
- Session management with HTTP-only cookies (`userId`, `userRole`)

### 2. Multi-Subject Assessment
- Three subjects, each with its own six-level scale (`lib/subjects.ts`)
  - **ภาษาอังกฤษ** — CEFR A1–C2
  - **คณิตศาสตร์** — M1–M6, criteria modelled on the six PISA Mathematics Literacy levels
  - **วิทยาศาสตร์** — S1–S6, criteria modelled on the six PISA Science Literacy levels
- All questions are written for this platform against the published level descriptors; none are copied from commercial exam banks
- English progress stays in `User.currentLevel`; other subjects live in `SubjectProgress` (one row per learner per subject)
- The same adaptive engine, topic tagging, and course recommendation apply to every subject
- Pass `?subject=` to `/api/question`, `/api/assessment/result`, `/api/recommendations`; omitting it means English, so existing links keep working

### 3. Adaptive Assessment (User Feature)
- Dynamic difficulty adjustment based on user performance
- Automatic level advancement when user reaches 80% accuracy
- Level demotion when accuracy drops below 50%
- Prevents level skipping - users must master current level first

### 4. Level Evaluation
- 6 proficiency levels: A1, A2, B1, B2, C1, C2
- Final assessment based on overall accuracy score
- Color-coded visual representation of levels

### 5. Course Recommendations
- Personalized course suggestions based on assessed level
- Courses include learning outcomes and duration
- Instructor information and detailed descriptions

### 5. Admin Video Management
- Upload English learning video clips
- AI-powered automatic CEFR level analysis
- Admin can override AI suggestions
- Assign videos to courses
- Delete or organize videos

### 6. AI Video Analysis (Claude API)
- Analyzes video title and description
- Suggests CEFR level (A1-C2) automatically
- Provides reasoning for the suggested level
- Confidence scoring for each suggestion
- Graceful fallback if API unavailable

### 7. Admin Course Management
- Create courses with CEFR level requirements
- Set course metadata (instructor, duration, outcomes)
- Add videos to courses
- Manage course visibility and details

### 8. Learning Analytics Dashboard
- Track learner statistics
- Level distribution per subject, switchable by tab (English / Math / Science)
- Learners are counted in a subject only once they have answered at least one question there
- Monitor course enrollments
- Insights and recommendations for admins

### 9. Course Payment via PromptPay QR
- Each course carries a price in THB (0 = free, enrolled instantly)
- Enrolling creates a payment record with a reference code (`LH-XXXXXX`)
- The learner is shown a PromptPay QR generated from `PROMPTPAY_ID` (default 0910391036) with the exact amount encoded
- Learner reports the transfer; admin approves or rejects it in the console
- Enrollment status flow: `awaiting_payment` → `pending_review` → `active` / `rejected`

### 10. Student Roster (Admin)
- Dedicated console tab listing every learner
- Shows a level badge per subject the learner has been assessed in, answer stats, and all enrolled courses
- Payment status, amount, reference and learner note per enrollment
- Approve/reject payments inline; search and filter by payment state

### 11. User Tracking
- Session-based user tracking using cookies
- Assessment history recording
- Progress statistics (correct/wrong answers, accuracy)
- Persistent user profiles with role information

### 12. AI Agents (8 total, `lib/ai/`)
- Every call goes through one runner (`lib/ai/runner.ts`) that records the agent
  name, model, status, tokens, and latency in the `AiUsage` table
- The console at `/admin/ai` reads that table, so "is the AI actually working"
  is a number rather than a claim. The previous AI integration failed silently
  by calling a retired model and falling back to a constant, which is what this
  logging exists to make impossible
- Every agent has a non-AI fallback: if the key is missing or the call fails,
  the original rule-based behaviour still runs

| Agent | Serves | Decision it supports |
|---|---|---|
| `explain-answer` | Learner | What the misunderstanding actually was |
| `recommend-courses` | Learner | What to study first among several weak topics |
| `select-question` | Learner | Which topic to probe next |
| `assess-writing` | Learner | What level their own writing reaches |
| `chatbot` | Learner | Questions about assessments, courses, payment |
| `analytics-insight` | Admin | Where to produce content next |
| `classify-video` | Admin | What level an uploaded clip belongs to |
| `generate-question` | Academic team | Whether a drafted question is usable |

### 13. Writing Assessment (`/writing`)
- Learners write a response to a prompt; the AI returns an estimated level,
  a confidence score, strengths, sentence-level corrections (original →
  corrected → why), and a suggested next step
- Minimum 15 words; Thai is counted by characters divided by average word
  length because Thai has no spaces between words
- The returned level is validated against the subject's own scale — a level
  outside it is rejected rather than shown
- This is the one feature multiple-choice questions cannot cover: they measure
  recognition, not production, and rule-based grammar checking cannot judge
  whether a piece of writing communicates
- Results are not persisted; the assessment is per-session feedback

### 14. Chat Assistant (`/api/chat`, `components/chat-widget.tsx`)
Four layers, cheapest first, stopping at the first that can answer:

| Layer | Answers from | Cost |
|---|---|---|
| 1 | The asker's own rows in the database | 0 tokens |
| 2 | The `Course` table (`lib/course-lookup.ts`) | 0 tokens |
| 3 | A written FAQ set (`lib/chat-faq.ts`) | 0 tokens |
| 4 | The `chatbot` agent | Model call |

- Layer 2 must precede the FAQ: "how much is course ENG11" contains the word
  for price, which matches the FAQ entry about the general price range and would
  answer with a range wider than that course's actual price
- Course codes are matched with whitespace collapsed, since people type both
  `ENG11` and `ENG 11`. A code needs at least two letters so level codes such as
  `A1` or `M3` are not mistaken for course names
- Asking about a course that does not exist says so and lists what is on offer,
  which the asker can act on, rather than refusing
- The `Course` table is only read when the question mentions a course at all
- Logged-out visitors get layers 2 and 3 only. Layer 4 needs a login because an
  unauthenticated model call is a cost anyone could trigger without limit

## Database Schema

### User Table
- Tracks individual learner information
- Stores current CEFR level and assessment statistics
- Records total correct and wrong answers

### Question Table
- Contains English proficiency questions
- Each question has multiple-choice options
- Categorized by CEFR level and difficulty (1-10)
- Includes explanations for learning

### AssessmentRecord Table
- Records each answer during an assessment
- Tracks progression and level changes
- Enables detailed analysis of learner performance

### Course Table
- Stores available courses
- Includes learning outcomes and instructor info
- Linked to CEFR levels for recommendations

## API Endpoints

### Assessment Management
- `POST /api/assessment` - Start new assessment
- `GET /api/question?level=A1` - Get question for level
- `POST /api/assessment/answer` - Submit answer
- `POST /api/assessment/advance` - Advance to next level
- `GET /api/assessment/result` - Get final results

### User Data
- `GET /api/dashboard` - Get user dashboard data
- `GET /api/courses` - Get all courses
- `POST /api/questions/seed` - Seed sample questions

### Enrollment & Payment
- `GET /api/enrollments` - Current user's enrollments
- `POST /api/enrollments` - Enroll in a course (creates payment record)
- `PATCH /api/enrollments/:id` - Learner reports the transfer
- `DELETE /api/enrollments/:id` - Cancel an unpaid enrollment
- `GET /api/payment/qr?enrollmentId=` - PromptPay QR (SVG), amount read from the DB

### AI & Assistant
- `POST /api/chat` - Chat assistant; the response carries `source`
  (`data` / `course` / `faq` / `ai` / `fallback`) and `usedAI`, so the UI can
  show whether an answer came from real data or from the model
- `GET /api/ai/writing?subject=` - Writing prompt for the learner's level
- `POST /api/ai/writing` - Assess a submitted piece of writing
- `POST /api/ai/explain` - Explain a wrong answer
- `GET /api/recommendations?subject=` - Ranked course recommendations

### Admin
- `GET /api/admin/students` - All learners with enrollments and payment status
- `PATCH /api/admin/enrollments/:id` - Approve or reject a payment
- `DELETE /api/admin/enrollments/:id` - Remove an enrollment
- `GET /api/admin/ai` - AI usage log (calls, status, tokens, latency)
- `GET|PATCH /api/admin/settings` - System settings; secret values are
  encrypted before being stored (see `lib/settings.ts`)
- `GET /api/admin/analytics` - Level distribution per subject
- `GET /api/admin/analytics/insight` - AI summary of the statistics

> **Route handlers must stay dynamic.** Next.js treats a `GET` handler that
> takes no `request` argument as static and runs it once at build time. Most
> routes here read the session cookie, which opts them into dynamic rendering
> automatically; the public ones do not, so they declare
> `export const dynamic = 'force-dynamic'` explicitly. `/api/courses` was
> missing it and served a build-time snapshot of the catalogue, so courses
> created afterwards never appeared on `/courses`.

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow Next.js best practices
- Use functional components with hooks
- Keep components focused and reusable

### Database Operations
- Use Prisma ORM exclusively (no raw SQL)
- Always handle errors appropriately
- Include proper error responses
- Use transactions for multi-step operations

### UI/UX
- Mobile-first responsive design
- Accessible HTML semantics
- Proper loading and error states
- Clear visual feedback on interactions

## Deployment Instructions

### To Vercel
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### To TiDB
1. Create TiDB Cloud cluster
2. Get connection string
3. Set `DATABASE_URL` environment variable
4. Run `npm run db:push`

## Performance Considerations

- Use CSS-in-JS (Tailwind) for efficient styling
- API responses are cached where appropriate
- Database queries are optimized with proper indexing
- Next.js automatic code splitting for route-based bundles

## Security Notes

- User sessions expire after 24 hours
- Password authentication with PBKDF2 hashing (see the known weakness below)
- Login is rate limited: 5 failed attempts in 15 minutes returns 429
- Five security headers are set in `next.config.js` (HSTS, X-Frame-Options,
  X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- Admin authority is read from the database on every request, never trusted
  from a client-supplied value
- Answer keys are never sent to the client alongside a question
- HTTPS enforced in production
- Database credentials never exposed to client

### Known weakness — password hashing (PRD FR-7.3)

`lib/auth.ts` calls `pbkdf2Sync(password, 'salt', 1000, 64, 'sha512')`. The salt
is a shared constant and 1,000 rounds is far below current guidance for
PBKDF2-SHA512. A shared salt means one precomputed table breaks every account at
once if the database ever leaks. Fixing it needs a per-user random salt, a much
higher round count, and a path that re-hashes an existing password the next time
its owner logs in, so nobody is forced to reset. This is item 1 in the PRD
backlog and is deliberately recorded rather than quietly left out.

## Future Enhancements

- Speaking assessment with speech recognition
- Listening comprehension exercises
- Real-time video streaming integration (not just URLs)
- Automated video transcription and subtitle generation
- Advanced analytics with progress reports
- Gamification features (badges, leaderboards, streaks)
- Email notifications for course updates
- Mobile app version (React Native)
- Peer-to-peer study groups
- Discussion forums per course
- Certificate generation on course completion
- Video recommendation algorithm
- Multi-language support (Thai, other languages)
- Advanced admin dashboard with charts
- Bulk video import from YouTube playlists
- Video comments and feedback system

## Testing

A repeatable security suite exists: 20 cases covering authorisation, session
handling, input validation, and answer-key exposure. It runs against a live
deployment and writes `security-test-results.json`. Method and results are in
[SECURITY_TESTING.md](SECURITY_TESTING.md).

Still missing:
- Unit tests for the level-advance/demote logic in `lib/assessment.ts`
- Unit tests for the chat course matcher in `lib/course-lookup.ts`
- Integration tests for API endpoints
- E2E tests for user flows

## Known Limitations

1. Questions are randomly selected without tracking previous answers
2. Video URL validation is basic (relies on admin responsibility)
3. AI analysis may have lower accuracy for non-English titles/descriptions
4. Course enrollment tracking exists but no completion certificates
5. No email notifications for course updates
6. Limited video metadata extraction (title/description only)
7. No real-time video streaming (only URL linking)
8. No progress export/reports for learners
