# 🏗️ Prescription Schedule Feature - Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    (backend/web/index.html)                     │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Upload     │  │   Schedule   │  │  Adherence   │        │
│  │   Section    │  │   Display    │  │   Tracking   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                            │
│                    (backend/app/main.py)                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              API Routes (ai_routes.py)                   │ │
│  │                                                          │ │
│  │  POST /prescription-schedule  ─┐                        │ │
│  │  GET  /prescription-schedules  │                        │ │
│  │  POST /medication-adherence    │                        │ │
│  └────────────────────────────────┼──────────────────────────┘ │
│                                   │                            │
│                                   ▼                            │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │           Services Layer                                 │ │
│  │                                                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │ LLM Service │  │File Service │  │Data Service │    │ │
│  │  │  (Gemini)   │  │  (Upload)   │  │  (MongoDB)  │    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                    │              │              │
                    ▼              ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Google     │  │  File System │  │   MongoDB    │
│   Gemini     │  │   (Uploads)  │  │  (Database)  │
│   AI API     │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Data Flow

### 1. Prescription Upload & Analysis

```
User
  │
  │ 1. Upload prescription image/PDF
  ▼
Frontend (index.html)
  │
  │ 2. FormData with file
  ▼
API Endpoint (/prescription-schedule)
  │
  ├─► 3a. File Service
  │     │ - Validate file size/type
  │     │ - Save to disk
  │     │ - Extract text (PDF)
  │     │ - Convert to base64 (image)
  │     └─► Return file_url & base64
  │
  ├─► 3b. LLM Service (Gemini)
  │     │ - Send image + text to AI
  │     │ - Extract medicines
  │     │ - Parse dosages & frequency
  │     │ - Generate timing schedule
  │     └─► Return structured data
  │
  ├─► 3c. Calculate Next Dose
  │     │ - Get current time
  │     │ - Compare with all timings
  │     │ - Find nearest future dose
  │     └─► Return next dose info
  │
  └─► 3d. Data Service
        │ - Save to MongoDB
        │ - Link to user
        └─► Return record_id
  │
  │ 4. JSON response
  ▼
Frontend
  │
  │ 5. Display schedule
  ▼
User sees medication schedule
```

### 2. Adherence Tracking

```
User
  │
  │ 1. Click "Mark as Taken"
  ▼
Frontend
  │
  │ 2. POST /medication-adherence
  ▼
API Endpoint
  │
  │ 3. Create log entry
  │    - medicine_name
  │    - scheduled_time
  │    - taken_at (timestamp)
  │    - status (taken/skipped)
  ▼
Data Service
  │
  │ 4. Save to MongoDB
  ▼
medication_adherence_logs collection
  │
  │ 5. Success response
  ▼
Frontend
  │
  │ 6. Show confirmation
  ▼
User sees "✓ Medication taken"
```

## Component Architecture

### Frontend Components

```
index.html
├── Upload Section
│   ├── Drag & Drop Area
│   ├── File Input
│   ├── Preview
│   └── Analyze Button
│
├── Loading State
│   ├── Spinner
│   └── Status Message
│
├── Results Section
│   ├── Next Dose Banner
│   │   ├── Time Display
│   │   └── Medicine Details
│   │
│   ├── Schedule Summary
│   │   └── Overview Text
│   │
│   └── Medicines Grid
│       └── Medicine Cards (multiple)
│           ├── Header (name, dosage, badge)
│           ├── Details (duration, frequency)
│           ├── Timing Section (time pills)
│           ├── Instructions
│           └── Adherence Buttons
│
└── Error Display
```

### Backend Components

```
ai_routes.py
├── prescription_schedule()
│   ├── File handling
│   ├── AI analysis
│   ├── Next dose calculation
│   └── Database save
│
├── get_prescription_schedules()
│   └── Retrieve user history
│
└── log_medication_adherence()
    └── Save adherence log

schemas.py
├── MedicineScheduleItem
├── PrescriptionScheduleRequest
├── PrescriptionScheduleResponse
└── MedicationAdherenceLog

data_service.py
├── save_prescription_schedule()
├── get_user_prescription_schedules()
└── save_medication_log()
```

## Database Schema

### Collections

```
prescription_schedules
├── _id: ObjectId
├── user_id: string
├── input
│   ├── prescription_text: string
│   └── file_url: string
├── output
│   ├── medicines: array
│   │   └── {name, dosage, times_per_day, duration_days, timing[], instructions}
│   ├── schedule_summary: string
│   ├── total_medicines: number
│   └── next_upcoming_dose: object
└── created_at: ISODate

medication_adherence_logs
├── _id: ObjectId
├── user_id: string
├── medicine_name: string
├── scheduled_time: string (HH:MM)
├── taken_at: ISODate
├── status: enum (taken|skipped|pending)
└── logged_at: ISODate
```

## AI Processing Pipeline

```
Input: Prescription Image/Text
  │
  ▼
┌─────────────────────────────────────┐
│     Google Gemini Vision Model      │
│                                     │
│  1. OCR & Text Extraction           │
│     - Read handwritten text         │
│     - Read printed text             │
│     - Identify medicine names       │
│                                     │
│  2. Medical Abbreviation Parsing    │
│     - BD → Twice daily              │
│     - TDS → Thrice daily            │
│     - QID → Four times daily        │
│     - AC/PC → Meal timing           │
│                                     │
│  3. Information Extraction          │
│     - Medicine names                │
│     - Dosages (mg, tablets, etc.)   │
│     - Frequency (times per day)     │
│     - Duration (days, weeks)        │
│     - Special instructions          │
│                                     │
│  4. Schedule Generation             │
│     - Convert frequency to times    │
│     - Assign specific hours         │
│     - Apply timing conventions      │
│                                     │
│  5. JSON Formatting                 │
│     - Structure data                │
│     - Validate fields               │
│     - Return formatted response     │
└─────────────────────────────────────┘
  │
  ▼
Output: Structured Schedule JSON
```

## Timing Algorithm

```python
def calculate_next_dose(medicines, current_time):
    """
    Find the next upcoming dose across all medicines
    """
    next_dose = None
    min_time_diff = infinity
    
    for medicine in medicines:
        for time_str in medicine.timing:
            # Parse time (HH:MM)
            dose_time = parse_time(time_str)
            
            # If time has passed today, check tomorrow
            if dose_time < current_time:
                dose_time = dose_time + 1_day
            
            # Calculate time difference
            time_diff = dose_time - current_time
            
            # Update if this is the nearest dose
            if time_diff < min_time_diff:
                min_time_diff = time_diff
                next_dose = {
                    "medicine": medicine.name,
                    "dosage": medicine.dosage,
                    "time": time_str,
                    "instructions": medicine.instructions
                }
    
    return next_dose
```

## Security Architecture

```
┌─────────────────────────────────────────┐
│          Security Layers                │
│                                         │
│  1. Input Validation                    │
│     ├── File size check (10MB max)      │
│     ├── File type validation            │
│     └── Content sanitization            │
│                                         │
│  2. Authentication (JWT)                │
│     ├── Token validation                │
│     ├── User identification             │
│     └── Session management              │
│                                         │
│  3. Authorization                       │
│     ├── User-specific data access       │
│     ├── Role-based permissions          │
│     └── Resource ownership check        │
│                                         │
│  4. Data Protection                     │
│     ├── Secure file storage             │
│     ├── Database encryption             │
│     └── HTTPS communication             │
│                                         │
│  5. Rate Limiting                       │
│     ├── API request throttling          │
│     ├── Upload frequency limits         │
│     └── Abuse prevention                │
└─────────────────────────────────────────┘
```

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Production Setup                       │
│                                                          │
│  ┌────────────┐      ┌────────────┐      ┌──────────┐  │
│  │   Nginx    │─────▶│  FastAPI   │─────▶│ MongoDB  │  │
│  │  (Reverse  │      │  (Uvicorn) │      │ (Replica │  │
│  │   Proxy)   │      │            │      │   Set)   │  │
│  └────────────┘      └────────────┘      └──────────┘  │
│        │                    │                           │
│        │                    │                           │
│        ▼                    ▼                           │
│  ┌────────────┐      ┌────────────┐                    │
│  │   SSL/TLS  │      │   Google   │                    │
│  │    Cert    │      │   Gemini   │                    │
│  └────────────┘      └────────────┘                    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │           File Storage (S3/Local)              │    │
│  │  /uploads/prescriptions/                       │    │
│  └────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

## Performance Optimization

```
Frontend
├── Lazy loading images
├── Debounced file uploads
├── Optimized CSS animations
├── Minimal JavaScript bundle
└── Responsive images

Backend
├── Async/await operations
├── Connection pooling (MongoDB)
├── File streaming
├── Caching (Redis - optional)
└── Background tasks (Celery - optional)

Database
├── Indexed queries (user_id)
├── Efficient aggregations
├── Document size optimization
└── Query result limiting
```

## Scalability Considerations

```
Horizontal Scaling
├── Load balancer (Nginx/HAProxy)
├── Multiple FastAPI instances
├── MongoDB replica set
└── Distributed file storage (S3)

Vertical Scaling
├── Increase server resources
├── Optimize database queries
├── Cache frequently accessed data
└── CDN for static assets

Microservices (Future)
├── Prescription Analysis Service
├── Notification Service
├── Adherence Tracking Service
└── User Management Service
```

## Monitoring & Logging

```
Application Logs
├── Request/Response logs
├── Error tracking
├── Performance metrics
└── User activity logs

Health Checks
├── /health endpoint
├── Database connectivity
├── LLM service status
└── File system availability

Metrics
├── API response times
├── Success/failure rates
├── User engagement
└── System resource usage
```

## Technology Stack

```
Frontend
├── HTML5
├── CSS3 (Grid, Flexbox, Animations)
├── Vanilla JavaScript (ES6+)
└── Fetch API

Backend
├── Python 3.9+
├── FastAPI (Web Framework)
├── Pydantic (Data Validation)
├── Uvicorn (ASGI Server)
└── PyMongo (MongoDB Driver)

AI/ML
├── Google Gemini 2.0 Flash
├── LangChain (LLM Integration)
└── PyMuPDF (PDF Processing)

Database
├── MongoDB (NoSQL)
└── GridFS (File Storage - optional)

DevOps
├── Docker (Containerization)
├── Docker Compose (Orchestration)
├── Git (Version Control)
└── GitHub Actions (CI/CD - optional)
```

## API Contract

### Request Format
```http
POST /api/v1/ai/prescription-schedule
Content-Type: multipart/form-data

prescription_file: <binary>
prescription_text: <string>
image_description: <string>
```

### Response Format
```json
{
  "medicines": [
    {
      "name": "string",
      "dosage": "string",
      "times_per_day": number,
      "duration_days": number,
      "timing": ["HH:MM", ...],
      "instructions": "string",
      "next_dose": "HH:MM" | null
    }
  ],
  "schedule_summary": "string",
  "total_medicines": number,
  "next_upcoming_dose": {
    "medicine": "string",
    "dosage": "string",
    "time": "HH:MM",
    "instructions": "string"
  } | null,
  "record_id": "string"
}
```

---

**Architecture designed for scalability, maintainability, and user experience.**
