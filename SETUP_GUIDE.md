# LearnHub - Setup & Configuration Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd learnhub2
npm install
```

### 2. Setup Environment Variables
Create a `.env.local` file in the root directory:

```bash
# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/learnhub"

# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3000"

# AI Analysis (Get from https://console.anthropic.com/)
ANTHROPIC_API_KEY="sk-ant-xxxxxxxxxxxxx"
```

### 3. Initialize Database
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed sample questions (optional)
curl http://localhost:3000/api/questions/seed -X POST
```

### 4. Start Development Server
```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

---

## 📋 User Roles & Workflows

### Student (User Role)

**Registration:**
1. Go to `/register`
2. Fill in email, password, name
3. Select "ผู้เรียน (User)" role
4. Click "สมัครสมาชิก"

**Taking Assessment:**
1. From home page, click "เริ่มการประเมินระดับ"
2. Answer questions (difficulty adjusts based on performance)
3. Get CEFR level result on `/result` page
4. View recommended courses based on level

**Viewing Courses:**
1. Go to `/courses`
2. Filter by CEFR level
3. View course details and enrollment

---

### Admin (Admin Role)

**Registration:**
1. Go to `/register`
2. Fill in details
3. Select "ผู้ดูแลระบบ (Admin)" role
4. Click "สมัครสมาชิก"

**Admin Dashboard:**
- Access at `/admin/dashboard`
- View statistics of uploaded videos and courses

**Upload Videos:**
1. Go to `/admin/videos`
2. Click "+ อัพโหลดวิดีโอใหม่"
3. Fill in:
   - Video title (e.g., "English Grammar Basics")
   - Description
   - Video URL (supports YouTube links)
   - Duration in seconds
4. Click "อัพโหลด"
5. **AI automatically analyzes** the video and suggests CEFR level

**Manage Video Level:**
1. On `/admin/videos`, see the suggested level from AI
2. Click "แก้ไข" to open video editor
3. Review AI suggestion and explanation
4. Optionally override with manual level selection
5. Assign to course if needed
6. Click "บันทึก"

**Create Courses:**
1. Go to `/admin/courses`
2. Click "+ สร้างคอร์สใหม่"
3. Fill in:
   - Course title
   - Description
   - Minimum CEFR level (required)
   - Maximum CEFR level (optional)
   - Instructor name
   - Duration in hours
4. Click "สร้าง"

**Add Videos to Course:**
1. Upload video first (see Upload Videos above)
2. When editing video, select course from dropdown
3. Videos appear in course on `/admin/courses`

**View Analytics:**
- Go to `/admin/analytics`
- See learner statistics:
  - Total students
  - Assessment completion rate
  - Course enrollments
  - Level distribution chart

---

## 🤖 AI Video Analysis

When you upload a video, Claude AI automatically:

1. **Analyzes Title & Description**
   - Extracts keywords and content themes

2. **Determines CEFR Level** by considering:
   - Vocabulary complexity
   - Grammar level
   - Speaking pace
   - Content difficulty
   - Target audience

3. **Suggests Level** (A1-C2) with:
   - Confidence score
   - Detailed reasoning
   - Explanation of why this level

4. **Manual Override**
   - You can still override AI suggestion
   - Useful if video has specialized content
   - Your manual choice is saved

**Example:**
- Upload "Business English: Negotiation Tips" → AI suggests **B2**
- Upload "Hello! My name is John" → AI suggests **A1**
- Upload "Machine Learning Applications in NLP" → AI suggests **C1**

---

## 🗄️ Database Schema

### Users Table
- Stores user credentials and profiles
- Tracks current CEFR level
- Records assessment statistics

### Videos Table
- Stores video metadata
- AI analysis results
- Admin-selected level
- Links to courses

### Courses Table
- Course metadata
- CEFR level requirements
- Associated videos
- Admin who created it

### AssessmentRecord Table
- Each answer during assessment
- User progression through levels
- Historical data for analytics

---

## 🔐 Security Notes

- Passwords are hashed using PBKDF2
- Authentication via HTTP-only cookies
- Admin-only endpoints protected with role checks
- Sessions expire after 7 days
- Video URLs are not validated (ensure trusted sources)

---

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Admin Endpoints (requires admin role)
- `POST /api/admin/videos` - Upload video
- `GET /api/admin/videos` - List videos
- `PATCH /api/admin/videos/[id]` - Update video
- `DELETE /api/admin/videos/[id]` - Delete video
- `POST /api/admin/courses` - Create course
- `GET /api/admin/courses` - List courses
- `PATCH /api/admin/courses/[id]` - Update course
- `DELETE /api/admin/courses/[id]` - Delete course
- `GET /api/admin/analytics` - Get statistics

### Assessment Endpoints
- `POST /api/assessment` - Start assessment
- `GET /api/question?level=A1` - Get question
- `POST /api/assessment/answer` - Submit answer
- `GET /api/assessment/result` - Get results

### Public Endpoints
- `GET /api/courses` - List all courses
- `GET /api/dashboard` - User dashboard

---

## 🚀 Deployment

### Deploy to Vercel
```bash
# Push to GitHub first
git add .
git commit -m "Initial commit"
git push origin main

# Then connect repo to Vercel and deploy
```

### Connect to TiDB
1. Create TiDB Cloud cluster at https://tidbcloud.com/
2. Get connection string
3. Set `DATABASE_URL` in Vercel environment variables:
   ```
   DATABASE_URL="mysql://[user]:[password]@[host]:[port]/[database]"
   ```
4. Run `npm run db:push` from Vercel CLI or local:
   ```bash
   npm run db:push
   ```

---

## 🐛 Troubleshooting

### Database Connection Error
- Verify `DATABASE_URL` is correct
- Ensure database user has proper permissions
- Check firewall allows connection

### AI Analysis Not Working
- Verify `ANTHROPIC_API_KEY` is set correctly
- Check API key has sufficient credits
- Review error logs in Vercel

### Videos Not Showing
- Verify video URL is valid and accessible
- Check CORS settings if using external sources
- Ensure video format is supported

### Authentication Issues
- Clear browser cookies
- Check if `userId` cookie is being set
- Verify session isn't expired (7 days)

---

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com)
- [CEFR Framework](https://www.coe.int/en/web/common-european-framework-reference-levels)

---

## 💡 Tips & Best Practices

1. **Video URLs**: Use direct video URLs or YouTube links
2. **CEFR Levels**: Follow official CEFR guidelines when overriding AI suggestions
3. **Course Creation**: Group videos by level before creating courses
4. **Analytics**: Check analytics weekly to understand learner distribution
5. **Content Update**: Regularly add new videos to keep courses fresh

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API endpoint documentation
3. Check Vercel logs for deployment issues
4. Review console errors in browser DevTools
