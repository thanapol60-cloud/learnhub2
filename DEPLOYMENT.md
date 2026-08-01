# LearnHub - Deployment Guide

## Step 1: Prepare GitHub Repository

```bash
cd c:\Users\User\Desktop\learnhub2

# Initialize git
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: LearnHub platform with adaptive assessment and AI video analysis"

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/learnhub2.git

# Push to GitHub
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 2: Setup TiDB Cloud Database

### Create TiDB Cluster:

1. Go to https://tidbcloud.com/
2. Sign up or login
3. Create a new cluster:
   - Choose **MySQL 8.0** compatibility
   - Select a region close to your users
   - Choose appropriate tier (free tier available)
   - Name it "learnhub"

4. Once cluster is created, get connection details:
   - Click on your cluster
   - Go to "Connect" tab
   - Copy the **MySQL Connection String**
   - It will look like:
     ```
     mysql://[user]:[password]@[host]:[port]/[database]?sslMode=REQUIRE
     ```

5. Save the connection string - you'll need it for Vercel

---

## Step 3: Deploy to Vercel

### Method 1: Via Web UI (Recommended)

1. Go to https://vercel.com
2. Sign up with GitHub account
3. Click "New Project"
4. Select your `learnhub2` repository
5. Configure project:
   - Framework: **Next.js**
   - Root Directory: **./** (leave default)
   - Build Command: **npm run build**
   - Output Directory: **.next**
   - Install Command: **npm install**

6. Add Environment Variables:
   ```
   DATABASE_URL = mysql://[from TiDB]
   ANTHROPIC_API_KEY = sk-ant-[your key]
   NEXT_PUBLIC_API_URL = https://[your-vercel-domain].vercel.app
   ```

7. Click "Deploy"

8. Wait for deployment to complete (takes 2-5 minutes)

### Method 2: Via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables when prompted
```

---

## Step 4: Initialize Database on Vercel

After deployment, run database migration:

### Option A: Via Vercel CLI
```bash
# This will run on the deployed environment
vercel env pull

npm run db:push
```

### Option B: Manual via Vercel Dashboard

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add `DATABASE_URL` with TiDB connection string
4. Redeploy the project

---

## Step 5: Seed Sample Data

After database is initialized, seed the questions:

```bash
# Call the seed endpoint from your deployed app
curl https://YOUR_VERCEL_DOMAIN.vercel.app/api/questions/seed -X POST
```

---

## Environment Variables Checklist

```env
# ✅ Required for Production
DATABASE_URL="mysql://..."                    # From TiDB Cloud
ANTHROPIC_API_KEY="sk-ant-..."               # From Anthropic console
NEXT_PUBLIC_API_URL="https://your-domain.vercel.app"

# ✅ Optional (Vercel auto-detects)
NODE_ENV="production"
```

---

## Verify Deployment

After deployment, test these endpoints:

```bash
# Test health
curl https://YOUR_DOMAIN.vercel.app/

# Test API
curl https://YOUR_DOMAIN.vercel.app/api/auth/me

# Test DB connection
curl https://YOUR_DOMAIN.vercel.app/api/courses
```

---

## TroubleshootingDeployment Issues

### ❌ Build Error: "DATABASE_URL not found"
**Solution:** Add `DATABASE_URL` to Vercel environment variables before deploy

### ❌ 500 Error: Database Connection Failed
**Solution:** 
1. Verify TiDB connection string is correct
2. Check TiDB cluster status on TiDBCloud dashboard
3. Ensure whitelist allows Vercel IPs (usually auto-configured)

### ❌ AI Analysis not working
**Solution:**
1. Verify `ANTHROPIC_API_KEY` is correct
2. Check API key has available credits
3. Review function logs in Vercel dashboard

### ❌ Videos not loading
**Solution:**
1. Check video URLs are accessible
2. Verify CORS settings if using external sources
3. Check browser console for specific errors

---

## Post-Deployment Tasks

### 1. Create Admin Account
```bash
# Go to your deployed site: https://your-domain.vercel.app
# Click Register → Select "Admin" → Submit
```

### 2. Upload Sample Videos
1. Login as admin
2. Go to `/admin/videos`
3. Upload test videos
4. Verify AI analysis works

### 3. Create Sample Courses
1. Go to `/admin/courses`
2. Create courses for each CEFR level
3. Add videos to courses

### 4. Test Student Flow
1. Login as regular user
2. Take assessment
3. Verify CEFR level result
4. Check course recommendations

---

## Monitoring & Maintenance

### Check Vercel Logs
```bash
vercel logs
# or view in dashboard: Settings → Analytics
```

### Monitor TiDB
1. Go to TiDBCloud dashboard
2. Check cluster status
3. Monitor query performance
4. View metrics and logs

### Update Code
```bash
# Make changes locally
git add .
git commit -m "Your message"
git push origin main

# Vercel auto-deploys on push to main branch
```

---

## Custom Domain (Optional)

### Add Custom Domain to Vercel
1. Go to Vercel project → Settings → Domains
2. Add your domain
3. Update DNS records (Vercel provides instructions)
4. Update `NEXT_PUBLIC_API_URL` in env vars

### Example:
```env
NEXT_PUBLIC_API_URL="https://learnhub.yourdomain.com"
```

---

## Scaling Considerations

### If site gets slow:
1. Check TiDB cluster resources
2. Upgrade TiDB tier if needed
3. Add caching layer (Redis)
4. Optimize database queries

### If storage is full:
1. Review TiDB usage in dashboard
2. Delete old assessment records if needed
3. Archive old videos

---

## Cost Estimation

| Service | Free Tier | Usage |
|---------|-----------|-------|
| **Vercel** | 3x deploy/month, unlimited traffic | Hobby plan |
| **TiDB Cloud** | 1 free cluster (1 shared node) | ~1GB storage |
| **Anthropic API** | $0.30 per 1M input tokens | ~$1-5/month for AI analysis |

---

## Success Checklist

- ✅ GitHub repository created and pushed
- ✅ TiDB cluster created and connected
- ✅ Vercel project deployed
- ✅ Environment variables configured
- ✅ Database initialized
- ✅ Sample questions seeded
- ✅ Admin account created
- ✅ Test assessment completed
- ✅ AI video analysis tested
- ✅ Monitoring set up

---

## Next Steps After Launch

1. **Promote Your Platform**
   - Share link with friends/students
   - Create marketing content

2. **Gather Feedback**
   - Monitor user registration
   - Collect feedback on courses
   - Improve based on usage patterns

3. **Add More Content**
   - Upload more videos regularly
   - Create courses for all levels
   - Expand question bank

4. **Monitor Performance**
   - Check Vercel analytics
   - Review TiDB metrics
   - Optimize slow queries

---

## Support Resources

- Vercel Docs: https://vercel.com/docs
- TiDB Cloud: https://docs.tidbcloud.com/
- Next.js: https://nextjs.org/docs
- Anthropic Claude: https://docs.anthropic.com
