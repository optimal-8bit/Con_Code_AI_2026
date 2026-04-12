# 📚 Deployment Documentation

Welcome to the deployment documentation for NextGen Health Platform! This folder contains everything you need to deploy your application to production.

---

## 📄 Documentation Files

### 1. **DEPLOYMENT_GUIDE.md** 📖
**Complete step-by-step deployment guide**

This is your main reference document with detailed instructions for:
- Setting up accounts (Vercel, Render, MongoDB Atlas)
- Configuring environment variables
- Deploying frontend to Vercel
- Deploying backend services to Render
- Connecting all services together
- Troubleshooting common issues

**When to use:** First-time deployment or when you need detailed explanations.

---

### 2. **DEPLOYMENT_CHECKLIST.md** ✅
**Interactive checklist for deployment**

A checkbox-style guide that walks you through deployment step-by-step:
- Pre-deployment setup
- Database configuration
- Backend deployment
- Frontend deployment
- Service connection
- Testing procedures

**When to use:** During actual deployment to track your progress.

---

### 3. **DEPLOYMENT_SUMMARY.md** ⚡
**Quick reference and architecture overview**

Contains:
- Architecture diagram
- Quick start commands
- Environment variables reference
- Ultra-quick deployment steps (25 minutes)
- Common issues and solutions
- Cost breakdown

**When to use:** Quick reference after initial deployment or for experienced users.

---

## 🛠️ Configuration Files

### 1. **render.yaml**
Render Blueprint configuration for backend services.

Defines:
- Main backend service (FastAPI)
- AI service (FastAPI)
- Build commands
- Start commands
- Environment variables

**Location:** Project root
**Auto-detected by:** Render when you create a Blueprint

---

### 2. **Web/vercel.json**
Vercel configuration for frontend deployment.

Defines:
- Build settings
- Output directory
- URL rewrites for SPA routing
- Cache headers for assets

**Location:** `Web/` directory
**Auto-detected by:** Vercel during deployment

---

## 🔧 Helper Scripts

### 1. **generate_secrets.py**
Generates secure random secrets for JWT and API keys.

```bash
python generate_secrets.py
```

**Output:** Secure 64-character JWT secret

**When to use:** Before deploying backend to generate JWT_SECRET

---

### 2. **validate_deployment.py**
Validates your project structure before deployment.

```bash
python validate_deployment.py
```

**Checks:**
- Required files exist
- Configuration files are present
- Environment variables are defined
- Git repository is set up
- Package.json has required scripts

**When to use:** Before pushing to Git and deploying

---

## 🚀 Quick Start

### First Time Deployment

1. **Validate your setup:**
   ```bash
   python validate_deployment.py
   ```

2. **Generate secrets:**
   ```bash
   python generate_secrets.py
   ```

3. **Follow the checklist:**
   Open `DEPLOYMENT_CHECKLIST.md` and follow step-by-step

4. **Need help?**
   Refer to `DEPLOYMENT_GUIDE.md` for detailed instructions

---

### Subsequent Deployments

After initial setup, deployments are automatic:

**Frontend (Vercel):**
- Push to `main` branch → Auto-deploys
- Pull request → Preview deployment

**Backend (Render):**
- Push to `main` branch → Auto-deploys
- Manual deploy option available

---

## 📋 Deployment Workflow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Prepare                                              │
│    • Run validate_deployment.py                         │
│    • Generate secrets                                   │
│    • Push code to Git                                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Database                                             │
│    • Create MongoDB Atlas cluster                       │
│    • Configure network access                           │
│    • Get connection string                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Backend (Render)                                     │
│    • Create Blueprint from render.yaml                  │
│    • Add environment variables                          │
│    • Deploy services                                    │
│    • Copy service URLs                                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Frontend (Vercel)                                    │
│    • Import Git repository                              │
│    • Configure build settings                           │
│    • Add VITE_API_URL                                   │
│    • Deploy                                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Connect Services                                     │
│    • Update backend CORS_ORIGINS                        │
│    • Update AI service CORS_ORIGINS                     │
│    • Test all endpoints                                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 6. Test & Monitor                                       │
│    • Test all features                                  │
│    • Check logs                                         │
│    • Set up monitoring                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Recommended Reading Order

### For First-Time Deployers:
1. **DEPLOYMENT_SUMMARY.md** - Get overview and architecture
2. **DEPLOYMENT_CHECKLIST.md** - Follow step-by-step
3. **DEPLOYMENT_GUIDE.md** - Reference when you need details

### For Experienced Deployers:
1. **DEPLOYMENT_SUMMARY.md** - Quick reference
2. **DEPLOYMENT_CHECKLIST.md** - Track progress

### For Troubleshooting:
1. **DEPLOYMENT_GUIDE.md** - Troubleshooting section
2. **DEPLOYMENT_SUMMARY.md** - Common issues section

---

## 🔑 Required Accounts

Before deployment, create accounts on:

1. **[Vercel](https://vercel.com/signup)** - Frontend hosting
   - Free tier available
   - GitHub/GitLab integration

2. **[Render](https://render.com/register)** - Backend hosting
   - Free tier available (with limitations)
   - GitHub/GitLab integration

3. **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)** - Database
   - Free tier available (M0 - 512MB)
   - No credit card required

---

## 🔐 Required API Keys

Gather these API keys before deployment:

1. **Google Gemini API Key**
   - Get from: [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Used for: AI features (symptom analysis, chat, etc.)

2. **Cloudinary Credentials**
   - Get from: [Cloudinary Console](https://cloudinary.com/console)
   - Used for: Image storage and processing

3. **Stripe API Keys**
   - Get from: [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
   - Used for: Payment processing

4. **Google OAuth Credentials**
   - Get from: [Google Cloud Console](https://console.cloud.google.com/)
   - Used for: Google authentication

---

## 💰 Cost Estimate

### Free Tier (Development)
- **Vercel:** $0/month
- **Render:** $0/month (with cold starts)
- **MongoDB Atlas:** $0/month (512 MB)
- **Total:** $0/month

### Production Tier
- **Vercel Pro:** $20/month
- **Render:** $14/month (2 services)
- **MongoDB Atlas M10:** $57/month
- **Total:** $91/month

---

## ⏱️ Time Estimates

- **First-time deployment:** 45-60 minutes
- **Subsequent deployments:** Automatic (2-5 minutes)
- **Database setup:** 10 minutes
- **Backend deployment:** 10-15 minutes
- **Frontend deployment:** 5 minutes
- **Testing:** 10-15 minutes

---

## 🆘 Getting Help

### Documentation
1. Check `DEPLOYMENT_GUIDE.md` troubleshooting section
2. Review `DEPLOYMENT_SUMMARY.md` common issues
3. Run `validate_deployment.py` to check setup

### Platform Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)

### Logs
- **Vercel:** Dashboard → Project → Deployments → Function Logs
- **Render:** Dashboard → Service → Logs tab
- **MongoDB:** Atlas → Metrics

---

## ✅ Pre-Deployment Checklist

Before you start deploying:

- [ ] Code is pushed to Git repository
- [ ] All required API keys are ready
- [ ] Accounts created (Vercel, Render, MongoDB Atlas)
- [ ] `validate_deployment.py` passes all checks
- [ ] JWT secret generated
- [ ] `.env` files are in `.gitignore`
- [ ] Local build and tests pass

---

## 🎉 Post-Deployment

After successful deployment:

1. **Test everything:**
   - User registration/login
   - Symptom checker
   - Prescription upload
   - Report upload
   - Chat functionality

2. **Set up monitoring:**
   - Vercel Analytics
   - Render alerts
   - MongoDB metrics

3. **Configure custom domain** (optional)

4. **Set up CI/CD** (already automatic with Git push)

5. **Plan for scaling:**
   - Monitor usage
   - Consider paid tiers
   - Optimize performance

---

## 📞 Support

If you encounter issues:

1. **Check validation:**
   ```bash
   python validate_deployment.py
   ```

2. **Review logs:**
   - Vercel deployment logs
   - Render service logs
   - Browser console errors

3. **Common fixes:**
   - Clear browser cache
   - Redeploy services
   - Check environment variables
   - Verify CORS settings

---

## 🚀 Ready to Deploy?

1. Run validation:
   ```bash
   python validate_deployment.py
   ```

2. Generate secrets:
   ```bash
   python generate_secrets.py
   ```

3. Open checklist:
   ```bash
   # Open DEPLOYMENT_CHECKLIST.md
   ```

4. Start deploying! 🎊

---

**Good luck with your deployment! 🚀**

For detailed instructions, start with `DEPLOYMENT_CHECKLIST.md` and refer to `DEPLOYMENT_GUIDE.md` as needed.
