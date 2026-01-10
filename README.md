<div align="center">

# 🚀 Macsauce Bomber

### *Enterprise-Grade Bulk Email Campaign Platform*

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/react-18.2+-61dafb.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688.svg)](https://fastapi.tiangolo.com/)
[![Status](https://img.shields.io/badge/status-production_ready-success.svg)]()

**A powerful, scalable email campaign management system with Gmail integration, real-time analytics, and personalized bulk sending capabilities.**

[Features](#-features) • [Demo](#-demo) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Tech Stack](#-tech-stack) • [Contributing](#-contributing)

</div>

---

## 📹 Demo

> **Video walkthrough coming soon!** Check back for a comprehensive demo showcasing all features.

<div align="center">
  <img src="https://ibb.co/WpHL8ySW" alt="Macsauce Bomber Demo" />
</div>

---

## ✨ Features

### 🎯 Campaign Management
- **Smart Campaign Creation** - Build sophisticated email campaigns with variable substitution
- **Template System** - Create, save, and reuse email templates with dynamic placeholders
- **Contact Import** - CSV/Excel file upload with intelligent parsing and validation
- **Scheduled Sending** - Queue campaigns for future delivery with timezone support
- **Draft Management** - Save campaigns as drafts and resume editing anytime

### 📊 Analytics & Insights
- **Real-Time Metrics** - Live tracking of sent, delivered, opened, and clicked emails
- **Performance Dashboard** - Visual charts with open rates, click rates, and engagement metrics
- **Campaign Analytics** - Individual campaign performance breakdowns
- **Export Reports** - Download analytics data in multiple formats

### 🔐 Security & Authentication
- **OAuth 2.0 Integration** - Secure Gmail authentication via Google OAuth
- **JWT Tokens** - Industry-standard authentication with refresh token support
- **User Management** - Multi-user support with role-based access (coming soon)
- **Data Encryption** - Sensitive data encrypted at rest and in transit

### 📧 Email Features
- **Personalization Engine** - Dynamic variable replacement for each recipient
- **HTML Support** - Rich text formatting with embedded images and styling
- **Attachment Support** - Send files with your campaigns
- **Unsubscribe Management** - One-click unsubscribe with compliance tracking
- **Rate Limiting** - Intelligent sending to comply with Gmail quotas
- **Retry Logic** - Automatic retry for failed sends with exponential backoff

### 🎨 User Experience
- **Modern UI** - Beautiful, responsive interface built with Tailwind CSS
- **Dark Mode** - Easy on the eyes with automatic theme switching
- **Real-Time Updates** - WebSocket integration for live progress tracking
- **Drag & Drop** - Intuitive file upload experience
- **Form Validation** - Client-side validation with helpful error messages
- **Toast Notifications** - Non-intrusive feedback for user actions

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Dashboard  │  │  Campaigns  │  │  Analytics & More   │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST API + WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (FastAPI + Python)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │   Auth   │  │Campaign  │  │  Gmail   │  │  Analytics │ │
│  │  Service │  │  Engine  │  │  Service │  │   Engine   │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
    ┌──────────┐      ┌──────────┐     ┌──────────┐
    │PostgreSQL│      │  Redis   │     │  Gmail   │
    │ Database │      │  Cache   │     │   API    │
    └──────────┘      └──────────┘     └──────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18.2** - Modern UI library with hooks and context
- **Vite 5** - Lightning-fast build tool and dev server
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **React Router v6** - Client-side routing
- **Axios** - HTTP client for API requests
- **Socket.IO Client** - Real-time bidirectional communication
- **Recharts** - Composable charting library
- **React Hook Form** - Performant form validation
- **Lucide React** - Beautiful icon library
- **PapaParse** - Powerful CSV parser

### Backend
- **FastAPI 0.109** - Modern Python web framework
- **SQLAlchemy 2.0** - SQL toolkit and ORM
- **Alembic** - Database migration tool
- **PostgreSQL** - Robust relational database
- **Redis** - In-memory data structure store for caching
- **Celery** - Distributed task queue for background jobs
- **Google APIs** - Gmail API integration for sending
- **Pydantic** - Data validation using Python type annotations
- **Uvicorn** - Lightning-fast ASGI server
- **Python-Jose** - JWT token handling
- **Passlib** - Password hashing library

### DevOps & Infrastructure
- **Docker & Docker Compose** - Containerization for easy deployment
- **Nginx** - Reverse proxy and static file serving
- **GitHub Actions** - CI/CD pipeline (optional)

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have installed:
- **Docker** (v20.10+) and **Docker Compose** (v2.0+)
- **Git**
- A **Gmail account** with API access enabled
- **Google Cloud Console** project with Gmail API enabled

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/macsauce-bomber.git
cd macsauce-bomber
```

### 2. Set Up Google OAuth Credentials

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Gmail API**
4. Create OAuth 2.0 credentials:
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:3000/auth/callback`
5. Download the credentials JSON file

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required environment variables:**

```env
# Backend Configuration
DATABASE_URL=postgresql://postgres:postgres@db:5432/macsauce_bomber
REDIS_URL=redis://redis:6379/0
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# Frontend Configuration
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
```

### 4. Launch the Application

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service health
docker-compose ps
```

### 5. Access the Application

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **API Documentation**: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
- **ReDoc**: [http://localhost:8000/api/redoc](http://localhost:8000/api/redoc)

### 6. Initialize Database

```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# (Optional) Seed sample templates
docker-compose exec backend python seed_templates.py
```

---

## 📖 Documentation

### Project Structure

```
macsauce-bomber/
├── backend/
│   ├── alembic/              # Database migrations
│   ├── app/
│   │   ├── api/              # API endpoints
│   │   │   ├── auth.py       # Authentication routes
│   │   │   ├── campaigns.py  # Campaign management
│   │   │   ├── emails.py     # Email sending
│   │   │   ├── templates.py  # Template CRUD
│   │   │   ├── parse.py      # File parsing
│   │   │   └── unsubscribe.py # Unsubscribe handling
│   │   ├── core/             # Core configuration
│   │   │   ├── config.py     # Settings management
│   │   │   └── database.py   # Database connection
│   │   ├── models/           # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── campaign.py
│   │   │   ├── template.py
│   │   │   ├── contact.py
│   │   │   └── email_log.py
│   │   ├── services/         # Business logic
│   │   │   ├── auth_service.py
│   │   │   ├── gmail_service.py
│   │   │   └── parse_service.py
│   │   └── main.py           # FastAPI application
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── Layout.jsx
│   │   │   └── Toast.jsx
│   │   ├── contexts/         # React contexts
│   │   │   ├── AuthContext.jsx
│   │   │   ├── ThemeContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── pages/            # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── NewCampaign.jsx
│   │   │   ├── CampaignDetail.jsx
│   │   │   ├── Templates.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── Unsubscribe.jsx
│   │   ├── services/         # API clients
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── package.json
│   └── tailwind.config.js
│
├── docker-compose.yml
├── .env
├── .gitignore
└── README.md
```

### API Documentation

Once the backend is running, visit [http://localhost:8000/api/docs](http://localhost:8000/api/docs) for interactive API documentation powered by Swagger UI.

#### Key API Endpoints

**Authentication**
```
POST   /api/auth/register        # Register new user
POST   /api/auth/login           # Login with credentials
POST   /api/auth/google          # OAuth with Google
GET    /api/auth/me              # Get current user
POST   /api/auth/refresh         # Refresh access token
```

**Campaigns**
```
GET    /api/campaigns            # List all campaigns
POST   /api/campaigns            # Create new campaign
GET    /api/campaigns/{id}       # Get campaign details
PUT    /api/campaigns/{id}       # Update campaign
DELETE /api/campaigns/{id}       # Delete campaign
POST   /api/campaigns/{id}/send  # Start sending campaign
```

**Templates**
```
GET    /api/templates            # List all templates
POST   /api/templates            # Create template
GET    /api/templates/{id}       # Get template
PUT    /api/templates/{id}       # Update template
DELETE /api/templates/{id}       # Delete template
```

**Emails**
```
POST   /api/emails/send          # Send single email
GET    /api/emails/logs          # Get email logs
GET    /api/emails/stats         # Get email statistics
```

**File Parsing**
```
POST   /api/parse/csv            # Parse CSV file
POST   /api/parse/excel          # Parse Excel file
POST   /api/parse/validate       # Validate email list
```

**Unsubscribe**
```
POST   /api/unsubscribe          # Unsubscribe email
GET    /api/unsubscribe/verify   # Verify unsubscribe status
```

---

## 🎓 Usage Guide

### Creating Your First Campaign

1. **Sign In** - Authenticate with Google OAuth
2. **Create Template** (optional) - Navigate to Templates and create a reusable template
3. **New Campaign** - Click "New Campaign" from dashboard
4. **Upload Contacts** - Import your CSV/Excel file with email addresses
5. **Customize Email** - Write your subject and body with variables like `{{name}}`
6. **Preview** - Check how your email looks with variable substitution
7. **Schedule or Send** - Choose to send immediately or schedule for later
8. **Monitor** - Watch real-time progress on the campaign detail page

### Variable Substitution

Use double curly braces for dynamic content:

```
Hello {{first_name}},

We hope you're doing well at {{company}}!

Best regards,
The Team
```

CSV format example:
```csv
email,first_name,company
john@example.com,John,Acme Corp
jane@example.com,Jane,Tech Inc
```

### Email Quotas & Rate Limiting

Gmail has sending limits:
- **Free Gmail**: 500 emails/day
- **Google Workspace**: 2,000 emails/day

Macsauce Bomber automatically rate-limits to prevent hitting quotas.

---

## 🔧 Development

### Local Development Setup

**Backend**

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend**

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run test
```

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## 🐳 Docker Deployment

### Production Build

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Scale workers
docker-compose -f docker-compose.prod.yml up -d --scale worker=3
```

### Environment Variables for Production

```env
# Security
DEBUG=False
SECRET_KEY=use-a-strong-random-secret-key-here

# Database
DATABASE_URL=postgresql://user:password@db:5432/macsauce_prod
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://:password@redis:6379/0

# CORS - Update with your domain
CORS_ORIGINS=["https://yourdomain.com"]

# OAuth - Update redirect URI
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/callback
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Code Style

- **Python**: Follow PEP 8 guidelines, use `black` for formatting
- **JavaScript**: Follow Airbnb style guide, use ESLint
- **Commits**: Use conventional commit messages

---

## 🐛 Troubleshooting

### Common Issues

**Gmail Authentication Fails**
- Ensure Gmail API is enabled in Google Cloud Console
- Check redirect URI matches exactly
- Verify OAuth consent screen is configured

**Database Connection Errors**
```bash
# Reset database
docker-compose down -v
docker-compose up -d db
docker-compose exec backend alembic upgrade head
```

**Port Already in Use**
```bash
# Change ports in docker-compose.yml or kill process
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:8000 | xargs kill -9  # Backend
```

**File Upload Issues**
- Check file size limits in `docker-compose.yml`
- Ensure `/uploads` directory has correct permissions
- Verify CSV/Excel format matches expected schema

---

## 📊 Performance

- **Handles** 10,000+ contacts per campaign
- **Sends** up to 500 emails/hour (Gmail free tier)
- **Scales** horizontally with Celery workers
- **Caches** frequently accessed data with Redis
- **Optimizes** database queries with SQLAlchemy indexes

---

## 🔒 Security

- OAuth 2.0 authentication with Google
- JWT tokens with refresh mechanism
- Password hashing with bcrypt
- SQL injection prevention via ORM
- XSS protection with content sanitization
- CORS configured for specific origins
- Rate limiting on API endpoints
- Environment variables for sensitive data
- HTTPS enforcement in production

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern web framework
- [React](https://reactjs.org/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Gmail API](https://developers.google.com/gmail/api) - Email sending
- [Socket.IO](https://socket.io/) - Real-time communication

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/macsauce-bomber/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/macsauce-bomber/discussions)
- **Email**: support@yourdomain.com

---

## 🗺️ Roadmap

- [ ] **v1.1** - Multi-user support with role-based access control
- [ ] **v1.2** - A/B testing for subject lines and content
- [ ] **v1.3** - SMS campaign support
- [ ] **v1.4** - Advanced segmentation and filtering
- [ ] **v1.5** - Email warmup sequences
- [ ] **v2.0** - Machine learning for send time optimization
- [ ] **v2.1** - Webhook integrations (Zapier, Make)
- [ ] **v2.2** - Custom SMTP server support
- [ ] **v2.3** - Mobile app (iOS & Android)
- [ ] **v3.0** - Multi-channel campaigns (Email + SMS + Social)

---

<div align="center">

**Built with ❤️ by the Macsauce Team**

[⬆ Back to Top](#-macsauce-bomber)

</div>
