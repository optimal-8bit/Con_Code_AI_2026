# Deployment Guide - NextGen Health Platform

This guide covers deploying your healthcare platform with:
- **Frontend (Web)** → Vercel
- **Backend** → Render
- **AI Service** → Render

---

## 📋 Prerequisites

Before starting, ensure you have:

1. **Accounts Created:**
   - [Vercel Account](https://vercel.com/signup)
   - [Render Account](https://render.com/register)
   - [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas/register) (for production database)

2. **API Keys Ready:**
   - Google Gemini API Key
   - Cloudinary credentials
   - Stripe API keys
   - Google OAuth credentials

3. **Code Repository:**
   - Push your code to GitHub/GitLab/Bitbucket

---

## 🚀 Part 1: Deploy Frontend to Vercel

### Step 1: Prepare Frontend for Deployment

1. **Update environment variables** - Create production `.env` file:
```bash
cd Web
```

2. **Test production build locally:**
```bash
npm run build
npm run preview
```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended)

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Click "Add New" → "Project"**

3. **Import your Git repository:**
   - Select your repository
   - Vercel will auto-detect it's a Vite project

4. **Configure Build Settings:**
   - **Framework Preset:** Vite
   - **Root Directory:** `Web`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

5. **Add Environment Variables:**
   Click "Environment Variables" and add:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
   ⚠️ **Important:** You'll update this URL after deploying the backend

6. **Click "Deploy"**

7. **Wait for deployment** (usually 2-3 minutes)

8. **Your frontend will be live at:** `https://your-project.vercel.app`

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to Web folder
cd Web

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? your-project-name
# - Directory? ./
# - Override settings? No

# For production deployment
vercel --prod
```

### Step 3: Configure Custom Domain (Optional)

1. Go to your project in Vercel Dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed

---

## 🔧 Part 2: Deploy Backend to Render

### Step 1: Prepare Backend for Deployment

1. **Create `render.yaml` in project root:**

```yaml
services:
  # Main Backend Service
  - type: web
    name: nextgen-health-backend
    runtime: python
    region: oregon
    plan: free
    rootDir: backend
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: GEMINI_API_KEY
        sync: false
      - key: GEMINI_MODEL
        value: gemini-2.5-flash
      - key: GEMINI_VISION_MODEL
        value: gemini-2.5-flash
      - key: MONGODB_URI
        sync: false
      - key: MONGODB_DB_NAME
        value: nextgen_health
      - key: JWT_SECRET
        sync: false
      - key: JWT_ACCESS_EXPIRE_MINUTES
        value: 120
      - key: JWT_REFRESH_EXPIRE_DAYS
        value: 30
      - key: CORS_ORIGINS
        sync: false
      - key: MAX_UPLOAD_SIZE_MB
        value: 15
      - key: STRIPE_SECRET_KEY
        sync: false
      - key: STRIPE_PUBLISHABLE_KEY
        sync: false
      - key: CLOUDINARY_CLOUD_NAME
        sync: false
      - key: CLOUDINARY_API_KEY
        sync: false
      - key: CLOUDINARY_API_SECRET
        sync: false
      - key: GOOGLE_CLIENT_ID
        sync: false
      - key: GOOGLE_CLIENT_SECRET
        sync: false
      - key: GOOGLE_REDIRECT_URI
        sync: false
      - key: FRONTEND_URL
        sync: false

  # AI Service
  - type: web
    name: nextgen-health-ai-service
    runtime: python
    region: oregon
    plan: free
    rootDir: ai-service
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: APP_NAME
        value: Healthcare AI Service
      - key: APP_VERSION
        value: 1.0.0
      - key: API_PREFIX
        value: /api
      - key: LLM_MODEL
        value: gemini-pro
      - key: EMBEDDING_MODEL
        value: models/embedding-001
      - key: TEMPERATURE
        value: 0.3
      - key: GOOGLE_API_KEY
        sync: false
      - key: MONGO_URI
        sync: false
      - key: MONGO_DB_NAME
        value: healthcare_ai
      - key: CORS_ORIGINS
        sync: false
```

2. **Commit and push to your repository:**
```bash
git add render.yaml
git commit -m "Add Render deployment configuration"
git push
```

### Step 2: Set Up MongoDB Atlas (Production Database)

1. **Go to [MongoDB Atlas](https://cloud.mongodb.com/)**

2. **Create a new cluster:**
   - Click "Build a Database"
   - Choose "Free" tier (M0)
   - Select a cloud provider and region
   - Click "Create"

3. **Create database user:**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Set username and password (save these!)
   - Set role to "Read and write to any database"

4. **Whitelist IP addresses:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Get connection string:**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

### Step 3: Deploy Backend to Render

1. **Go to [Render Dashboard](https://dashboard.render.com/)**

2. **Click "New" → "Blueprint"**

3. **Connect your repository:**
   - Click "Connect account" for GitHub/GitLab
   - Select your repository
   - Render will detect `render.yaml`

4. **Review services:**
   - You should see 2 services:
     - `nextgen-health-backend`
     - `nextgen-health-ai-service`

5. **Add environment variables for Backend service:**

   Click on the backend service and add these secret values:

   ```
   GEMINI_API_KEY=your_gemini_api_key
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=generate_a_random_secret_key_here
   CORS_ORIGINS=https://your-frontend.vercel.app,https://your-backend.onrender.com
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=https://your-backend.onrender.com/api/v1/auth/google/callback
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

6. **Add environment variables for AI Service:**

   Click on the AI service and add:

   ```
   GOOGLE_API_KEY=your_gemini_api_key
   MONGO_URI=your_mongodb_atlas_connection_string
   CORS_ORIGINS=["https://your-frontend.vercel.app","https://your-backend.onrender.com"]
   ```

7. **Click "Apply"** to start deployment

8. **Wait for deployment** (5-10 minutes for first deploy)

9. **Your services will be live at:**
   - Backend: `https://nextgen-health-backend.onrender.com`
   - AI Service: `https://nextgen-health-ai-service.onrender.com`

### Step 4: Verify Backend Deployment

Test your backend endpoints:

```bash
# Test backend health
curl https://your-backend.onrender.com/health

# Test AI service health
curl https://your-ai-service.onrender.com/health
```

---

## 🔗 Part 3: Connect Frontend to Backend

### Step 1: Update Frontend Environment Variables

1. **Go to Vercel Dashboard**

2. **Select your frontend project**

3. **Go to "Settings" → "Environment Variables"**

4. **Update `VITE_API_URL`:**
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```

5. **Click "Save"**

6. **Redeploy frontend:**
   - Go to "Deployments"
   - Click "..." on latest deployment
   - Click "Redeploy"

### Step 2: Update Backend CORS Settings

1. **Go to Render Dashboard**

2. **Select your backend service**

3. **Go to "Environment"**

4. **Update `CORS_ORIGINS` to include your Vercel URL:**
   ```
   CORS_ORIGINS=https://your-project.vercel.app,https://your-backend.onrender.com
   ```

5. **Update `FRONTEND_URL`:**
   ```
   FRONTEND_URL=https://your-project.vercel.app
   ```

6. **Save changes** (service will auto-redeploy)

---

## ✅ Part 4: Post-Deployment Checklist

### Test All Features

- [ ] Frontend loads correctly
- [ ] User authentication works
- [ ] Symptom checker functions
- [ ] Prescription analysis works
- [ ] Report explanation works
- [ ] Chat functionality works
- [ ] File uploads work
- [ ] Database connections are stable

### Monitor Services

1. **Vercel:**
   - Check deployment logs
   - Monitor function execution
   - Set up analytics

2. **Render:**
   - Check service logs
   - Monitor resource usage
   - Set up alerts

### Security Checklist

- [ ] All API keys are in environment variables (not in code)
- [ ] CORS is properly configured
- [ ] HTTPS is enabled (automatic on Vercel/Render)
- [ ] MongoDB network access is configured
- [ ] JWT secrets are strong and unique

---

## 🔄 Part 5: Continuous Deployment

Both Vercel and Render support automatic deployments:

### Vercel (Frontend)
- Automatically deploys on every push to `main` branch
- Preview deployments for pull requests
- Rollback to previous deployments anytime

### Render (Backend)
- Automatically deploys on every push to `main` branch
- Manual deploy option available
- Zero-downtime deployments

---

## 🐛 Troubleshooting

### Frontend Issues

**Build fails on Vercel:**
```bash
# Check build locally first
cd Web
npm install
npm run build
```

**Environment variables not working:**
- Ensure variables start with `VITE_`
- Redeploy after changing environment variables

### Backend Issues

**Service won't start on Render:**
- Check logs in Render Dashboard
- Verify all required environment variables are set
- Check Python version compatibility

**Database connection fails:**
- Verify MongoDB Atlas connection string
- Check network access whitelist (0.0.0.0/0)
- Ensure database user has correct permissions

**CORS errors:**
- Update `CORS_ORIGINS` to include your frontend URL
- Ensure no trailing slashes in URLs

### Common Render Free Tier Limitations

- Services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- 750 hours/month free (enough for 1 service 24/7)
- Consider upgrading for production use

---

## 💰 Cost Estimates

### Free Tier (Development/Testing)

- **Vercel:** Free (Hobby plan)
  - 100 GB bandwidth/month
  - Unlimited deployments
  
- **Render:** Free
  - 750 hours/month per service
  - Services spin down after inactivity
  
- **MongoDB Atlas:** Free (M0)
  - 512 MB storage
  - Shared RAM
  - Good for development

**Total: $0/month**

### Production Tier (Recommended)

- **Vercel Pro:** $20/month
  - 1 TB bandwidth
  - Better performance
  
- **Render:** $7/month per service × 2 = $14/month
  - Always-on services
  - 512 MB RAM per service
  
- **MongoDB Atlas M10:** $57/month
  - 10 GB storage
  - Dedicated resources

**Total: ~$91/month**

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)

---

## 🎉 Success!

Your NextGen Health platform is now deployed and accessible worldwide!

- **Frontend:** https://your-project.vercel.app
- **Backend API:** https://your-backend.onrender.com
- **AI Service:** https://your-ai-service.onrender.com

Remember to monitor your services and set up proper logging and error tracking for production use.
