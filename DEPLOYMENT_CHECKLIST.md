# 🚀 Quick Deployment Checklist

Use this checklist to deploy your NextGen Health platform step-by-step.

---

## 📝 Pre-Deployment Setup

### 1. Create Accounts
- [ ] Create [Vercel account](https://vercel.com/signup)
- [ ] Create [Render account](https://render.com/register)
- [ ] Create [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas/register)

### 2. Prepare API Keys
- [ ] Get Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- [ ] Get Cloudinary credentials from [Cloudinary Console](https://cloudinary.com/console)
- [ ] Get Stripe keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
- [ ] Set up Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/)

### 3. Push Code to Git
- [ ] Push your code to GitHub/GitLab/Bitbucket
- [ ] Ensure `render.yaml` is in the root directory

---

## 🗄️ Database Setup (MongoDB Atlas)

- [ ] Log in to MongoDB Atlas
- [ ] Click "Build a Database" → Choose "Free" (M0 tier)
- [ ] Select cloud provider and region
- [ ] Create database user (save username & password!)
- [ ] Go to "Network Access" → Add IP → "Allow Access from Anywhere" (0.0.0.0/0)
- [ ] Get connection string from "Connect" → "Connect your application"
- [ ] Replace `<password>` in connection string with your database password
- [ ] Save connection string: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`

---

## 🔧 Backend Deployment (Render)

### Deploy Services

- [ ] Go to [Render Dashboard](https://dashboard.render.com/)
- [ ] Click "New" → "Blueprint"
- [ ] Connect your Git repository
- [ ] Render detects `render.yaml` and shows 2 services
- [ ] Click "Apply" to create services

### Configure Backend Service Environment Variables

Go to `nextgen-health-backend` service → Environment:

```
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/
JWT_SECRET=your_random_secret_key_min_32_chars
CORS_ORIGINS=https://your-frontend.vercel.app
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-backend.onrender.com/api/v1/auth/google/callback
FRONTEND_URL=https://your-frontend.vercel.app
```

- [ ] Add all environment variables
- [ ] Save changes (service will auto-deploy)
- [ ] Wait for deployment to complete (~5-10 minutes)
- [ ] Copy backend URL: `https://nextgen-health-backend.onrender.com`

### Configure AI Service Environment Variables

Go to `nextgen-health-ai-service` service → Environment:

```
GOOGLE_API_KEY=your_gemini_api_key_here
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/
CORS_ORIGINS=["https://your-frontend.vercel.app"]
```

- [ ] Add all environment variables
- [ ] Save changes (service will auto-deploy)
- [ ] Wait for deployment to complete
- [ ] Copy AI service URL: `https://nextgen-health-ai-service.onrender.com`

### Test Backend

- [ ] Test backend: `curl https://your-backend.onrender.com/health`
- [ ] Test AI service: `curl https://your-ai-service.onrender.com/health`
- [ ] Both should return `{"status": "ok"}` or similar

---

## 🌐 Frontend Deployment (Vercel)

### Deploy to Vercel

- [ ] Go to [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] Click "Add New" → "Project"
- [ ] Import your Git repository
- [ ] Configure project settings:
  - **Framework Preset:** Vite
  - **Root Directory:** `Web`
  - **Build Command:** `npm run build`
  - **Output Directory:** `dist`
  - **Install Command:** `npm install`

### Add Environment Variable

- [ ] Click "Environment Variables"
- [ ] Add: `VITE_API_URL` = `https://your-backend.onrender.com`
- [ ] Click "Deploy"
- [ ] Wait for deployment (~2-3 minutes)
- [ ] Copy frontend URL: `https://your-project.vercel.app`

---

## 🔗 Connect Services

### Update Backend CORS

- [ ] Go to Render → Backend service → Environment
- [ ] Update `CORS_ORIGINS` to: `https://your-project.vercel.app,https://your-backend.onrender.com`
- [ ] Update `FRONTEND_URL` to: `https://your-project.vercel.app`
- [ ] Update `GOOGLE_REDIRECT_URI` to: `https://your-backend.onrender.com/api/v1/auth/google/callback`
- [ ] Save (service will redeploy)

### Update AI Service CORS

- [ ] Go to Render → AI service → Environment
- [ ] Update `CORS_ORIGINS` to: `["https://your-project.vercel.app","https://your-backend.onrender.com"]`
- [ ] Save (service will redeploy)

### Update Frontend API URL

- [ ] Go to Vercel → Your project → Settings → Environment Variables
- [ ] Confirm `VITE_API_URL` = `https://your-backend.onrender.com`
- [ ] If changed, go to Deployments → Redeploy latest

---

## ✅ Testing

### Test Frontend
- [ ] Visit your Vercel URL: `https://your-project.vercel.app`
- [ ] Page loads without errors
- [ ] No console errors in browser DevTools

### Test Authentication
- [ ] Try to register a new user
- [ ] Try to login
- [ ] Check if JWT token is stored

### Test AI Features
- [ ] Test symptom checker
- [ ] Upload and analyze a prescription image
- [ ] Upload and explain a medical report PDF
- [ ] Test chat functionality

### Test File Uploads
- [ ] Upload prescription image
- [ ] Upload medical report PDF
- [ ] Check if files are processed correctly

### Check Logs
- [ ] Check Render logs for backend errors
- [ ] Check Render logs for AI service errors
- [ ] Check Vercel logs for frontend errors

---

## 🎉 Deployment Complete!

Your services are now live:

- ✅ **Frontend:** https://your-project.vercel.app
- ✅ **Backend:** https://your-backend.onrender.com
- ✅ **AI Service:** https://your-ai-service.onrender.com
- ✅ **Database:** MongoDB Atlas

---

## 📊 Monitor Your Services

### Vercel
- [ ] Set up [Vercel Analytics](https://vercel.com/analytics)
- [ ] Monitor deployment logs
- [ ] Set up custom domain (optional)

### Render
- [ ] Check service health regularly
- [ ] Monitor resource usage
- [ ] Set up email alerts for service failures

### MongoDB Atlas
- [ ] Monitor database metrics
- [ ] Set up backup schedule
- [ ] Monitor storage usage

---

## ⚠️ Important Notes

### Free Tier Limitations

**Render Free Tier:**
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds (cold start)
- 750 hours/month per service (enough for 1 service 24/7)

**Solution for cold starts:**
- Use a service like [UptimeRobot](https://uptimerobot.com/) to ping your services every 5 minutes
- Or upgrade to paid plan ($7/month per service)

**Vercel Free Tier:**
- 100 GB bandwidth/month
- Unlimited deployments
- Usually sufficient for development/testing

**MongoDB Atlas Free Tier:**
- 512 MB storage
- Shared resources
- Good for development, consider upgrading for production

---

## 🔒 Security Reminders

- [ ] All sensitive keys are in environment variables (not in code)
- [ ] `.env` files are in `.gitignore`
- [ ] CORS is properly configured
- [ ] MongoDB network access is configured
- [ ] Use strong JWT secrets (min 32 characters)
- [ ] Enable 2FA on all service accounts

---

## 🆘 Need Help?

If you encounter issues:

1. **Check logs:**
   - Render: Dashboard → Service → Logs
   - Vercel: Dashboard → Project → Deployments → View Function Logs

2. **Common issues:**
   - CORS errors → Check CORS_ORIGINS includes your frontend URL
   - Database connection fails → Check MongoDB connection string and network access
   - Build fails → Check logs for missing dependencies
   - 502/503 errors → Service might be starting up (wait 30-60 seconds)

3. **Resources:**
   - [Vercel Documentation](https://vercel.com/docs)
   - [Render Documentation](https://render.com/docs)
   - [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)

---

## 🚀 Next Steps

- [ ] Set up custom domain
- [ ] Configure SSL certificates (automatic on Vercel/Render)
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Add error tracking (e.g., Sentry)
- [ ] Set up logging service
- [ ] Plan for scaling (upgrade to paid tiers)

---

**Congratulations! Your NextGen Health platform is now live! 🎊**
