# LearnHub - English Proficiency Assessment Platform

An adaptive English proficiency assessment platform that uses CEFR (Common European Framework of Reference) level evaluation and recommends personalized courses.

## Features

- **User Authentication**: Register and login with different roles (User, Admin)
- **Adaptive Testing**: Questions adjust in difficulty based on your performance
- **CEFR Level Assessment**: Receive a standardized English proficiency level (A1-C2)
- **Dynamic Difficulty**: Advance to harder levels as you improve, demote if you struggle
- **Course Recommendations**: Get personalized course suggestions based on your level
- **Progress Tracking**: Monitor your assessment history and improvement over time
- **Admin Video Upload**: Upload English learning videos with AI-powered level analysis
- **AI Difficulty Analysis**: Claude AI automatically suggests CEFR level for videos
- **Course Management**: Create and manage learning courses from uploaded videos
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS

## CEFR Levels

- **A1/A2**: Elementary level
- **B1/B2**: Intermediate and Upper-Intermediate level
- **C1/C2**: Advanced and Proficiency level

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: TiDB/MySQL with Prisma ORM
- **Deployment**: Vercel (frontend), TiDB Cloud (database)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- TiDB database (or local MySQL)
- Anthropic API Key (for AI video analysis)

### Installation

1. Clone the repository
```bash
cd learnhub2
npm install
```

2. Create a `.env.local` file with your configuration
```bash
DATABASE_URL="mysql://user:password@localhost:3306/learnhub"
ANTHROPIC_API_KEY="your-anthropic-api-key"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

3. Generate Prisma client
```bash
npm run db:generate
```

4. Push schema to database
```bash
npm run db:push
```

5. Seed sample questions
```bash
npm run seed
```

6. Start the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

### For Students (User Role)
1. **Register/Login** (`/register`, `/login`): Create account as a user
2. **Home Page** (`/`): Start an assessment or view your dashboard
3. **Assessment** (`/assessment`): Take the adaptive English test
4. **Result** (`/result`): View your CEFR level and recommended courses
5. **Dashboard** (`/dashboard`): Track your progress and history
6. **Courses** (`/courses`): Browse all available courses

### For Administrators (Admin Role)
1. **Register as Admin** (`/register`): Select "Admin" role when registering
2. **Admin Dashboard** (`/admin/dashboard`): Main admin interface
3. **Manage Videos** (`/admin/videos`):
   - Upload English learning video clips
   - AI automatically analyzes and suggests CEFR level
   - Manually adjust the assigned level if needed
   - Add videos to existing courses
4. **Manage Courses** (`/admin/courses`):
   - Create new courses with CEFR level requirements
   - Set course metadata (instructor, duration, learning outcomes)
   - Add uploaded videos to courses

## API Endpoints

- `POST /api/assessment` - Initialize a new assessment
- `GET /api/question?level=A1` - Get a question for a specific level
- `POST /api/assessment/answer` - Submit an answer
- `POST /api/assessment/advance` - Advance to next level
- `GET /api/assessment/result` - Get assessment results
- `GET /api/dashboard` - Get user dashboard data
- `GET /api/courses` - Get all available courses

## Database Schema

### User
- Tracks current CEFR level and assessment statistics
- Stores correct/wrong answer counts

### Question
- Contains English proficiency questions
- Includes options, explanations, and difficulty ratings
- Categorized by CEFR level

### AssessmentRecord
- Records each answer during assessment
- Tracks progression through levels

### Course
- Stores available courses
- Recommends based on CEFR level

## Assessment Algorithm

### Student Assessment
The platform uses an adaptive testing algorithm:
- Start at level A1
- Answer 3 consecutive correct questions → Can advance to next level
- Answer 2 consecutive wrong questions → Demote to previous level
- Cannot advance without mastering current level
- Minimum of 10 questions before showing final results

### AI Video Analysis
When an admin uploads a video, Claude AI automatically:
1. Analyzes the video title and description
2. Considers vocabulary complexity and grammar level
3. Evaluates speaking pace and content difficulty
4. Suggests an appropriate CEFR level (A1-C2)
5. Provides reasoning for the suggested level
6. Admin can override the AI suggestion if needed

## Deployment to Vercel

```bash
npm run build
# Push to GitHub then deploy via Vercel
```

## Deployment to TiDB

1. Create a TiDB Cloud cluster
2. Update `DATABASE_URL` environment variable
3. Run `npm run db:push` to initialize schema

## Future Enhancements

- [ ] Audio/listening component
- [ ] Speaking assessment via speech recognition
- [ ] More comprehensive question bank
- [ ] User authentication and accounts
- [ ] Progress analytics and reports
- [ ] Leaderboards and achievement badges
- [ ] Mobile app version

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
