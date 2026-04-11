# 🚀 Deployment Checklist - Doctor & Pharmacy System

## Pre-Deployment Checklist

### 🔧 Backend Configuration

#### Environment Variables
- [ ] Set production MongoDB URI
- [ ] Set production Stripe keys (live mode)
- [ ] Generate strong JWT secret
- [ ] Configure CORS for production domain
- [ ] Set appropriate token expiration times
- [ ] Configure file upload limits
- [ ] Set production Gemini API key

```env
# Production .env example
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/nextgen_health
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
JWT_SECRET=your-super-secure-random-string-here
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

#### Database
- [ ] Create production MongoDB database
- [ ] Set up database indexes for performance
- [ ] Configure database backups
- [ ] Test database connection
- [ ] Run seed script for initial data (optional)

```python
# Create indexes for better performance
from app.db.mongo import mongo_service

# User indexes
mongo_service.collection("users").create_index("email", unique=True)
mongo_service.collection("users").create_index("role")

# Appointment indexes
mongo_service.collection("appointments").create_index("doctor_id")
mongo_service.collection("appointments").create_index("patient_id")
mongo_service.collection("appointments").create_index("scheduled_at")

# Order indexes
mongo_service.collection("orders").create_index("pharmacy_id")
mongo_service.collection("orders").create_index("patient_id")
mongo_service.collection("orders").create_index("payment_status")

# Inventory indexes
mongo_service.collection("inventory").create_index("pharmacy_id")
mongo_service.collection("inventory").create_index("medicine_name")
```

#### Security
- [ ] Enable HTTPS/SSL
- [ ] Set secure cookie flags
- [ ] Implement rate limiting
- [ ] Add request validation
- [ ] Enable CORS properly
- [ ] Sanitize user inputs
- [ ] Add API key authentication for admin routes

```python
# Add rate limiting (install: pip install slowapi)
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Apply to routes
@app.post("/api/v1/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, payload: LoginRequest):
    ...
```

#### Logging & Monitoring
- [ ] Set up structured logging
- [ ] Configure log rotation
- [ ] Add error tracking (Sentry, etc.)
- [ ] Set up performance monitoring
- [ ] Add health check endpoints
- [ ] Configure alerts for errors

```python
# Enhanced logging
import logging
from logging.handlers import RotatingFileHandler

handler = RotatingFileHandler(
    'logs/app.log',
    maxBytes=10000000,
    backupCount=5
)
handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
))
logging.getLogger().addHandler(handler)
```

### 💳 Stripe Configuration

#### Live Mode Setup
- [ ] Create Stripe live account
- [ ] Get live API keys
- [ ] Configure webhook endpoints
- [ ] Test payment flow in live mode
- [ ] Set up payment failure handling
- [ ] Configure refund policies

```bash
# Stripe webhook setup
stripe listen --forward-to https://yourdomain.com/api/v1/webhooks/stripe
```

#### Payment Security
- [ ] Implement 3D Secure (SCA)
- [ ] Add fraud detection
- [ ] Set up dispute handling
- [ ] Configure payment receipts
- [ ] Add payment retry logic

### 🗄️ Database Optimization

#### Indexes
```python
# Run this script before deployment
from app.db.mongo import mongo_service

collections_indexes = {
    "users": [
        ("email", 1),
        ("role", 1),
    ],
    "appointments": [
        ("doctor_id", 1),
        ("patient_id", 1),
        ("scheduled_at", -1),
        ("status", 1),
    ],
    "orders": [
        ("pharmacy_id", 1),
        ("patient_id", 1),
        ("payment_status", 1),
        ("created_at", -1),
    ],
    "inventory": [
        ("pharmacy_id", 1),
        ("medicine_name", 1),
    ],
    "prescriptions": [
        ("patient_id", 1),
        ("doctor_id", 1),
        ("pharmacy_id", 1),
    ],
}

for collection, indexes in collections_indexes.items():
    col = mongo_service.collection(collection)
    for index in indexes:
        col.create_index([index])
```

#### Backup Strategy
- [ ] Set up automated daily backups
- [ ] Test backup restoration
- [ ] Configure backup retention policy
- [ ] Store backups in secure location

### 🎨 Frontend Deployment

#### Build Configuration
- [ ] Set production API URL
- [ ] Configure Stripe publishable key
- [ ] Optimize bundle size
- [ ] Enable production mode
- [ ] Add error boundaries
- [ ] Configure CDN for assets

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          stripe: ['@stripe/stripe-js', '@stripe/react-stripe-js'],
        },
      },
    },
  },
};
```

#### Performance
- [ ] Enable code splitting
- [ ] Lazy load routes
- [ ] Optimize images
- [ ] Add service worker (PWA)
- [ ] Enable gzip compression
- [ ] Add caching headers

### 🔒 Security Hardening

#### API Security
```python
# Add security headers
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

app.add_middleware(TrustedHostMiddleware, allowed_hosts=["yourdomain.com"])
app.add_middleware(HTTPSRedirectMiddleware)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000"
    return response
```

#### Input Validation
- [ ] Validate all user inputs
- [ ] Sanitize file uploads
- [ ] Limit file sizes
- [ ] Validate email formats
- [ ] Check password strength
- [ ] Prevent SQL injection (using ORM)

### 📊 Monitoring & Analytics

#### Application Monitoring
- [ ] Set up APM (Application Performance Monitoring)
- [ ] Configure error tracking
- [ ] Add custom metrics
- [ ] Set up dashboards
- [ ] Configure alerts

```python
# Example with Sentry
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[FastApiIntegration()],
    traces_sample_rate=1.0,
)
```

#### Business Metrics
- [ ] Track user registrations by role
- [ ] Monitor appointment bookings
- [ ] Track order completion rates
- [ ] Monitor payment success rates
- [ ] Track revenue metrics

### 🧪 Testing

#### Pre-Deployment Tests
- [ ] Run all unit tests
- [ ] Run integration tests
- [ ] Test payment flow end-to-end
- [ ] Test all user roles
- [ ] Load testing
- [ ] Security testing

```bash
# Run tests
pytest backend/tests/

# Load testing with locust
locust -f load_tests.py --host=https://yourdomain.com
```

#### User Acceptance Testing
- [ ] Test complete patient flow
- [ ] Test complete doctor flow
- [ ] Test complete pharmacy flow
- [ ] Test payment processing
- [ ] Test notifications
- [ ] Test error scenarios

### 🚀 Deployment Steps

#### 1. Backend Deployment

##### Option A: Docker
```dockerfile
# Dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Build and run
docker build -t nextgen-health-backend .
docker run -p 8000:8000 --env-file .env nextgen-health-backend
```

##### Option B: Traditional Server
```bash
# Install dependencies
pip install -r requirements.txt

# Run with gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

##### Option C: Cloud Platform (Heroku, AWS, etc.)
```bash
# Heroku example
heroku create nextgen-health-api
heroku config:set MONGODB_URI=your_uri
heroku config:set STRIPE_SECRET_KEY=your_key
git push heroku main
```

#### 2. Frontend Deployment

```bash
# Build
npm run build

# Deploy to Netlify/Vercel
netlify deploy --prod

# Or to S3/CloudFront
aws s3 sync dist/ s3://your-bucket/
```

#### 3. Database Migration
```bash
# Backup existing data
mongodump --uri="mongodb://localhost:27017/nextgen_health" --out=backup/

# Restore to production
mongorestore --uri="mongodb+srv://prod-uri" backup/
```

### 📝 Post-Deployment

#### Verification
- [ ] Test all API endpoints
- [ ] Verify database connections
- [ ] Test payment processing
- [ ] Check email notifications
- [ ] Verify file uploads
- [ ] Test all user flows

#### Monitoring
- [ ] Check error logs
- [ ] Monitor API response times
- [ ] Track payment success rates
- [ ] Monitor database performance
- [ ] Check server resources

#### Documentation
- [ ] Update API documentation
- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Document backup/restore procedures
- [ ] Create incident response plan

### 🔄 Continuous Deployment

#### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          pip install -r requirements.txt
          pytest

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # Your deployment commands
```

### 📊 Performance Optimization

#### Backend
- [ ] Enable response caching
- [ ] Optimize database queries
- [ ] Add connection pooling
- [ ] Enable compression
- [ ] Use CDN for static files

```python
# Add caching
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache

@app.get("/api/v1/doctors")
@cache(expire=300)  # Cache for 5 minutes
async def get_doctors():
    ...
```

#### Frontend
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Image optimization
- [ ] Bundle size optimization
- [ ] Service worker caching

### 🆘 Rollback Plan

#### Preparation
- [ ] Document current version
- [ ] Create database backup
- [ ] Tag release in git
- [ ] Document rollback steps

#### Rollback Procedure
```bash
# 1. Revert code
git revert HEAD
git push

# 2. Restore database (if needed)
mongorestore --uri="mongodb+srv://prod-uri" backup/

# 3. Clear caches
# 4. Verify system health
```

### 📞 Support & Maintenance

#### Monitoring Alerts
- [ ] Set up uptime monitoring
- [ ] Configure error rate alerts
- [ ] Set up payment failure alerts
- [ ] Monitor database performance
- [ ] Track API response times

#### Regular Maintenance
- [ ] Weekly log review
- [ ] Monthly security updates
- [ ] Quarterly performance review
- [ ] Regular backup testing
- [ ] Dependency updates

### ✅ Final Checklist

Before going live:
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] Backup system verified
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Team trained on new features
- [ ] Rollback plan documented
- [ ] Support team ready
- [ ] Announcement prepared

### 🎉 Go Live!

Once all items are checked:
1. Schedule deployment window
2. Notify users of maintenance
3. Deploy backend
4. Deploy frontend
5. Run smoke tests
6. Monitor for issues
7. Announce launch
8. Celebrate! 🎊

---

**Remember**: Always test in staging environment before production deployment!
