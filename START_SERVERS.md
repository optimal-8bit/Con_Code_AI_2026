# 🚀 Start Servers Guide

## Quick Start

### 1. Start Backend
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

**Backend will be available at:** http://localhost:8000

### 2. Start Frontend (New Terminal)
```bash
cd Web
npm install  # First time only
npm run dev
```

**Frontend will be available at:** http://localhost:5173

## ✅ Verify Everything Works

### Check Backend
1. Open http://localhost:8000/docs
2. You should see the FastAPI Swagger documentation
3. All API endpoints should be listed

### Check Frontend
1. Open http://localhost:5173
2. You should see the login page
3. Click "Sign up" to create an account

## 🐛 Troubleshooting

### Backend Issues

**Error: "No module named 'jose'"**
```bash
cd backend
pip install python-jose[cryptography] passlib[bcrypt]
```

**Error: "No module named 'motor'"**
```bash
cd backend
pip install -r requirements.txt
```

**Error: "MongoDB connection failed"**
- Make sure MongoDB is running
- Check your `.env` file has correct `MONGODB_URI`
- Default: `mongodb://localhost:27017/nextgen_health`

**Error: "Port 8000 already in use"**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or use different port
uvicorn app.main:app --reload --port 8001
```

### Frontend Issues

**Error: "Cannot connect to backend"**
- Make sure backend is running on port 8000
- Check `Web/.env` has `VITE_API_URL=http://localhost:8000`

**Error: "Port 5173 already in use"**
```bash
# Kill the process
npx kill-port 5173

# Or Vite will automatically use next available port
```

**Error: "Module not found"**
```bash
cd Web
rm -rf node_modules package-lock.json
npm install
```

## 📝 Environment Setup

### Backend `.env` (backend/.env)
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/nextgen_health

# JWT
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Google AI (Optional - for AI features)
GOOGLE_API_KEY=your-google-api-key

# Stripe (Optional - for payments)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# File Upload
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=uploads
```

### Frontend `.env` (Web/.env)
```env
VITE_API_URL=http://localhost:8000
```

## 🎯 Development Workflow

### Terminal 1: Backend
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### Terminal 2: Frontend
```bash
cd Web
npm run dev
```

### Terminal 3: MongoDB (if not running as service)
```bash
mongod --dbpath /path/to/data
```

## 🔥 Hot Reload

Both servers support hot reload:
- **Backend**: Automatically reloads on Python file changes
- **Frontend**: Automatically reloads on React file changes

## 📊 Check Status

### Backend Health
```bash
curl http://localhost:8000/
# Should return: {"message": "NextGen Health API"}
```

### Frontend Health
Open http://localhost:5173 in browser

## 🎉 You're Ready!

Once both servers are running:
1. Open http://localhost:5173
2. Register a new account
3. Start testing features!

## 💡 Pro Tips

- Keep both terminals visible to see logs
- Backend logs show API requests
- Frontend logs show in browser console
- Use browser DevTools Network tab to debug API calls

## 🆘 Still Having Issues?

1. Check all dependencies are installed
2. Verify MongoDB is running
3. Check firewall/antivirus settings
4. Try restarting both servers
5. Clear browser cache
6. Check for port conflicts

**Happy Coding! 🚀**
