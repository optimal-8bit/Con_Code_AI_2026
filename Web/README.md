# NextGen Health - Frontend

A modern, scalable React frontend for the NextGen Health MVP healthcare platform.

## Features

### Patient Dashboard
- View health metrics and upcoming appointments
- Manage prescriptions and medications
- Upload and track medical records
- Search and book appointments with doctors
- Order medicines from pharmacies
- AI-powered health insights

### Doctor Dashboard
- Manage appointments and patient consultations
- View patient medical history
- Issue digital prescriptions
- Track workload with AI recommendations

### Pharmacy Dashboard
- Process medicine orders
- Manage inventory with low-stock alerts
- Dispense prescriptions
- Track revenue and order fulfillment

### AI Features (Available to All Users)
- **Symptom Checker**: AI-powered symptom analysis with severity assessment
- **Prescription Analyzer**: Extract and explain prescription details
- **Report Explainer**: Understand medical reports in simple language
- **Smart Chat**: Interactive health assistant for general queries

## Tech Stack

- **React 19** - UI framework
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality UI components
- **Zustand** - State management
- **Axios** - HTTP client with interceptors
- **Lucide React** - Icon library
- **Vite** - Build tool

## Project Structure

```
Web/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── DashboardLayout.jsx    # Main dashboard layout
│   │   └── ui/                        # shadcn UI components
│   ├── pages/
│   │   ├── auth/                      # Login & Register
│   │   ├── patient/                   # Patient pages
│   │   ├── doctor/                    # Doctor pages
│   │   ├── pharmacy/                  # Pharmacy pages
│   │   └── ai/                        # AI feature pages
│   ├── services/
│   │   ├── auth.service.js            # Authentication
│   │   ├── patient.service.js         # Patient operations
│   │   ├── doctor.service.js          # Doctor operations
│   │   ├── pharmacy.service.js        # Pharmacy operations
│   │   └── ai.service.js              # AI features
│   ├── store/
│   │   └── useAuthStore.js            # Auth state management
│   ├── lib/
│   │   ├── api-client.js              # Axios instance with JWT
│   │   └── utils.js                   # Utility functions
│   ├── App.jsx                        # Main app with routing
│   └── main.jsx                       # Entry point
├── .env                               # Environment variables
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend server running on `http://localhost:8000`

### Installation

1. Install dependencies:
```bash
cd Web
npm install
```

2. Configure environment:
```bash
# .env file is already created with:
VITE_API_URL=http://localhost:8000
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

## Architecture

### API Client
- Centralized Axios instance with automatic JWT token attachment
- Automatic token refresh on 401 errors
- Request/response interceptors for error handling

### Service Layer
- Clean separation between UI and API logic
- Each service handles a specific domain (auth, patient, doctor, pharmacy, AI)
- All API calls go through service functions

### State Management
- Zustand for global auth state
- Local component state for UI-specific data
- No prop drilling - clean component hierarchy

### Routing
- Protected routes with role-based access control
- Automatic redirect based on user role
- Lazy loading ready for optimization

### Component Structure
- Reusable UI components from shadcn/ui
- Shared DashboardLayout for all authenticated pages
- Consistent design patterns across all dashboards

## Key Features Implementation

### Authentication Flow
1. User logs in → JWT tokens stored in localStorage
2. API client attaches token to all requests
3. On 401 error → Automatic token refresh
4. On refresh failure → Redirect to login

### Role-Based Access
- Patient: Full access to patient routes + AI features
- Doctor: Full access to doctor routes + AI features
- Pharmacy: Full access to pharmacy routes + AI features

### File Uploads
- Prescription images/PDFs
- Medical report uploads
- Automatic file validation and processing

### Real-time Updates
- Dashboard metrics refresh on page load
- Notifications system
- Order status tracking

## Styling Approach

The UI is built with Tailwind CSS and shadcn/ui components, designed to be:
- **Clean and Modern**: Professional healthcare aesthetic
- **Responsive**: Mobile-first design
- **Accessible**: WCAG compliant components
- **Extensible**: Ready for glass morphism effects and animations

### Future Enhancements (Prepared For)
- Glass morphism effects (utility classes ready)
- React Bits animations
- Dark mode support
- Advanced data visualizations

## API Integration

All backend routes are fully integrated:

### Auth Routes (`/auth/*`)
- Register, Login, Logout
- Profile management
- Password change

### Patient Routes (`/patient/*`)
- Dashboard with AI insights
- Appointments CRUD
- Prescriptions & medications
- Medical records upload
- Pharmacy orders
- Doctor search

### Doctor Routes (`/doctor/*`)
- Dashboard with workload summary
- Appointment management
- Patient records access
- Prescription issuance

### Pharmacy Routes (`/pharmacy/*`)
- Dashboard with inventory insights
- Order processing
- Prescription dispensing
- Inventory management

### AI Routes (`/ai/*`)
- Symptom checker
- Prescription analyzer
- Report explainer
- Smart chat

## Error Handling

- User-friendly error messages
- Automatic retry for failed requests
- Graceful degradation
- Loading states for all async operations

## Security

- JWT tokens in localStorage (httpOnly cookies recommended for production)
- Automatic token refresh
- Protected routes
- Input validation
- XSS protection via React

## Performance

- Code splitting ready
- Lazy loading prepared
- Optimized bundle size
- Efficient re-renders with proper state management

## Testing

```bash
npm run lint  # ESLint checks
```

## Deployment

### Environment Variables
Update `.env` for production:
```
VITE_API_URL=https://your-production-api.com
```

### Build
```bash
npm run build
```

Deploy the `dist/` folder to your hosting service (Vercel, Netlify, etc.)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code structure
2. Use TypeScript types (when migrating to TS)
3. Write meaningful commit messages
4. Test all user flows before committing

## License

MIT
