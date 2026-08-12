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
│   └── seed.ts              # Database seeding script
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

### 2. Adaptive Assessment (User Feature)
- Dynamic difficulty adjustment based on user performance
- Automatic level advancement when user reaches 80% accuracy
- Level demotion when accuracy drops below 50%
- Prevents level skipping - users must master current level first

### 3. CEFR Level Evaluation
- 6 proficiency levels: A1, A2, B1, B2, C1, C2
- Final assessment based on overall accuracy score
- Color-coded visual representation of levels

### 4. Course Recommendations
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
- View CEFR level distribution
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
- Shows CEFR level, answer stats, and all enrolled courses per student
- Payment status, amount, reference and learner note per enrollment
- Approve/reject payments inline; search and filter by payment state

### 11. User Tracking
- Session-based user tracking using cookies
- Assessment history recording
- Progress statistics (correct/wrong answers, accuracy)
- Persistent user profiles with role information

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

### Admin
- `GET /api/admin/students` - All learners with enrollments and payment status
- `PATCH /api/admin/enrollments/:id` - Approve or reject a payment
- `DELETE /api/admin/enrollments/:id` - Remove an enrollment

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
- No password authentication (current version)
- HTTPS enforced in production
- Database credentials never exposed to client

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

Currently no test suite implemented. Suggested additions:
- Unit tests for assessment algorithms
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
