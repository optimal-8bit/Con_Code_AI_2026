# Frontend Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
cd Web
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open Browser
Navigate to `http://localhost:5173`

## 🎯 Test User Flows

### Register New Users
1. Go to `/register`
2. Create accounts for each role:
   - **Patient**: Test patient features
   - **Doctor**: Test doctor features  
   - **Pharmacy**: Test pharmacy features

### Login
1. Go to `/login`
2. Use credentials from registration
3. Automatically redirected to role-specific dashboard

## 📱 Key Pages to Test

### Patient Flow
- `/patient/dashboard` - Overview with AI insights
- `/patient/appointments` - Book appointments
- `/patient/prescriptions` - View prescriptions
- `/patient/medications` - Track medications
- `/patient/records` - Upload medical records
- `/patient/orders` - Order medicines
- `/patient/doctors` - Find doctors

### Doctor Flow
- `/doctor/dashboard` - Workload overview
- `/doctor/appointments` - Manage appointments
- `/doctor/patients` - View patient list
- `/doctor/prescriptions` - Issue prescriptions

### Pharmacy Flow
- `/pharmacy/dashboard` - Business metrics
- `/pharmacy/orders` - Process orders
- `/pharmacy/prescriptions` - Dispense prescriptions
- `/pharmacy/inventory` - Manage stock

### AI Features (All Roles)
- `/ai/symptom-checker` - Analyze symptoms
- `/ai/prescription-analyzer` - Extract prescription data
- `/ai/report-explainer` - Understand medical reports
- `/ai/chat` - Health assistant chatbot

## 🔧 Configuration

### Environment Variables
File: `Web/.env`
```
VITE_API_URL=http://localhost:8000
```

### Backend Connection
Ensure backend is running on port 8000:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

## 🎨 UI Components

Built with:
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality components
- **Lucide Icons** - Beautiful icons

### Component Library
All UI components are in `src/components/ui/`:
- Button, Input, Card
- Ready for customization

## 🔐 Authentication

### How It Works
1. Login → JWT tokens stored in localStorage
2. All API requests include token automatically
3. Token refresh on expiry
4. Auto-logout on auth failure

### Test Credentials
Create your own via `/register` page

## 📊 State Management

- **Zustand** for global auth state
- Local state for component-specific data
- No Redux complexity

## 🛠️ Development Tips

### Hot Reload
Changes auto-reload in browser

### API Errors
Check browser console for detailed error messages

### Network Requests
Use browser DevTools → Network tab to debug API calls

### Component Structure
```
Page Component
  ↓
DashboardLayout (sidebar, header)
  ↓
Cards & Content
  ↓
UI Components (buttons, inputs)
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173
npx kill-port 5173
npm run dev
```

### API Connection Failed
- Check backend is running on port 8000
- Verify `VITE_API_URL` in `.env`
- Check browser console for CORS errors

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Styling Issues
```bash
# Rebuild Tailwind
npm run dev
```

## 📦 Build for Production

```bash
npm run build
npm run preview  # Test production build locally
```

Output: `dist/` folder ready for deployment

## 🚢 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

### Environment Variables
Set `VITE_API_URL` to production backend URL

## 📚 Next Steps

1. **Customize Styling**: Edit Tailwind config
2. **Add Features**: Follow existing patterns
3. **Optimize**: Add lazy loading
4. **Test**: Add unit tests with Vitest
5. **Deploy**: Push to production

## 💡 Pro Tips

- Use React DevTools for debugging
- Check Network tab for API issues
- Use Tailwind IntelliSense in VS Code
- Keep components small and focused
- Follow existing code patterns

## 🎓 Learning Resources

- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [React Router](https://reactrouter.com)

## ✅ Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] Can register new user
- [ ] Can login successfully
- [ ] Dashboard loads with data
- [ ] Can navigate between pages
- [ ] AI features work
- [ ] File uploads work

## 🎉 You're Ready!

The frontend is fully integrated with the backend. All features are working and ready for demo or further development.

**Happy Coding! 🚀**
