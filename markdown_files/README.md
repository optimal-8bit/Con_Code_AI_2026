# 🏥 NextGen Health - AI-Powered Healthcare Platform

A complete healthcare ecosystem connecting patients, doctors, and pharmacies with AI-powered features.

## 🎯 Overview

NextGen Health is a modern healthcare platform that provides:
- **Patient Portal**: Book appointments, track medications, upload medical records
- **Doctor Portal**: Manage appointments, issue prescriptions, view patient history
- **Pharmacy Portal**: Process orders, manage inventory, dispense prescriptions
- **AI Features**: Symptom checker, prescription analyzer, report explainer, smart chat

## ✨ Key Features

### For Patients
- 📅 Book and manage appointments with doctors
- 💊 Track medications and prescriptions
- 📄 Upload and manage medical records
- 🏪 Order medicines from pharmacies
- 🤖 AI-powered health insights
- 💬 Smart health chatbot

### For Doctors
- 📊 Dashboard with workload overview
- 👥 Manage patient appointments
- 📝 Issue digital prescriptions
- 📋 Access patient medical history
- 🤖 AI-powered recommendations

### For Pharmacies
- 📦 Process medicine orders
- 📊 Inventory management with alerts
- 💰 Revenue tracking
- 📋 Prescription dispensing
- 🤖 AI inventory insights

### AI Tools (All Users)
- 🩺 **Symptom Checker**: Analyze symptoms with AI
- 💊 **Prescription Analyzer**: Extract and explain prescriptions
- 📊 **Report Explainer**: Understand medical reports
- 💬 **Smart Chat**: Interactive health assistant

## 🏗️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database
- **LangChain** - AI/LLM integration
- **Google Gemini** - AI model
- **JWT** - Authentication
- **Stripe** - Payment processing

### Frontend
- **React 19** - UI framework
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Zustand** - State management
- **Axios** - HTTP client
- **Vite** - Build tool

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- MongoDB
- npm or yarn

### 1. Clone Repository
```bash
git clone <repository-url>
cd nextgen-health
```

### 2. Setup Backend
```bash
cd backend
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Start backend
uvicorn app.main:app --reload --port 8000
```

### 3. Setup Frontend
```bash
cd Web
npm install

# .env is already configured
# Start frontend
npm run dev
```

### 4. Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📚 Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Get started quickly
- **[Frontend Guide](Web/QUICKSTART_FRONTEND.md)** - Frontend setup
- **[Demo Script](DEMO_SCRIPT.md)** - Presentation guide
- **[Testing Guide](FRONTEND_TESTING_GUIDE.md)** - Testing procedures
- **[Start Servers](START_SERVERS.md)** - Server setup help

## 🎬 Demo Flow

1. **Register** as Patient, Doctor, or Pharmacy
2. **Patient**: Book appointment, use AI symptom checker
3. **Doctor**: Confirm appointment, issue prescription
4. **Patient**: Order medicines from pharmacy
5. **Pharmacy**: Process order, manage inventory
6. **All**: Use AI features for health insights

## 📁 Project Structure

```
nextgen-health/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Config & security
│   │   ├── db/             # Database
│   │   ├── models/         # Pydantic schemas
│   │   └── services/       # Business logic
│   └── requirements.txt
│
├── Web/                    # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # State management
│   │   └── lib/            # Utilities
│   └── package.json
│
└── docs/                   # Documentation
```

## 🔐 Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/nextgen_health
SECRET_KEY=your-secret-key
GOOGLE_API_KEY=your-google-api-key
STRIPE_SECRET_KEY=your-stripe-key
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
```

## 🧪 Testing

### Manual Testing
```bash
# Follow the testing guide
See FRONTEND_TESTING_GUIDE.md
```

### API Testing
```bash
# Access Swagger UI
http://localhost:8000/docs
```

## 🚢 Deployment

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd Web
npm run build
# Deploy dist/ folder to hosting service
```

### Recommended Hosting
- **Backend**: Railway, Render, AWS
- **Frontend**: Vercel, Netlify
- **Database**: MongoDB Atlas

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 API Endpoints

### Authentication
- `POST /auth/register` - Register user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user
- `PATCH /auth/me` - Update profile

### Patient
- `GET /patient/dashboard` - Get dashboard
- `GET /patient/appointments` - List appointments
- `POST /patient/appointments` - Book appointment
- `GET /patient/prescriptions` - List prescriptions
- `POST /patient/records` - Upload medical record
- `GET /patient/medications` - List medications
- `POST /patient/orders` - Create pharmacy order

### Doctor
- `GET /doctor/dashboard` - Get dashboard
- `GET /doctor/appointments` - List appointments
- `PATCH /doctor/appointments/{id}` - Update appointment
- `GET /doctor/patients` - List patients
- `POST /doctor/prescriptions` - Issue prescription

### Pharmacy
- `GET /pharmacy/dashboard` - Get dashboard
- `GET /pharmacy/orders` - List orders
- `PATCH /pharmacy/orders/{id}/status` - Update order
- `GET /pharmacy/inventory` - List inventory
- `POST /pharmacy/inventory` - Add inventory item

### AI Features
- `POST /ai/symptom-checker` - Analyze symptoms
- `POST /ai/prescription-analyzer` - Analyze prescription
- `POST /ai/report-explainer` - Explain medical report
- `POST /ai/smart-chat` - Chat with AI assistant

## 🎓 Learning Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/)

## 📊 Features Status

- ✅ User Authentication (JWT)
- ✅ Patient Portal (Complete)
- ✅ Doctor Portal (Complete)
- ✅ Pharmacy Portal (Complete)
- ✅ AI Features (4 tools)
- ✅ File Uploads
- ✅ Real-time Updates
- ✅ Responsive Design
- ✅ Payment Integration (Stripe)

## 🐛 Known Issues

- None currently reported

## 📞 Support

For issues and questions:
1. Check documentation
2. Review testing guide
3. Check browser console
4. Review API logs

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- FastAPI for the amazing framework
- React team for React 19
- Tailwind CSS for styling
- shadcn for UI components
- Google for Gemini AI

## 🎉 Status

**✅ Production Ready**

The platform is fully functional and ready for:
- Hackathon demos
- MVP launch
- User testing
- Production deployment

---

**Built with ❤️ for better healthcare**

**Happy Coding! 🚀**
