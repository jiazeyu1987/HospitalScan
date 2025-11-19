# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Hospital Monitoring System** (全国医院官网扫描与招投标监控系统) - a full-stack web application for automatically scanning Chinese hospital websites and monitoring their tender/bidding information.

**Technology Stack:**
- **Backend**: Flask 2.3.3 + SQLAlchemy + APScheduler
- **Frontend**: React 18 + TypeScript + Ant Design + Vite
- **Database**: SQLite (development) / PostgreSQL (production)
- **Package Manager**: pnpm (frontend) / pip (backend)

## Quick Start Commands

### Backend Development
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Start development server (auto-initializes database)
python run.py
# Server runs on: http://localhost:5000

# Initialize database manually (if needed)
python run.py --init-db

# Run API tests
python api_test.py

# Run backend tests
pytest

# Code formatting and linting
black .
flake8 .
mypy .
```

### Frontend Development
```bash
# Navigate to frontend directory
cd hospital-monitor-antd

# Install dependencies
pnpm install

# Start development server
pnpm run dev
# Application runs on: http://localhost:3000

# Build for production
pnpm run build

# Build for production with optimizations
pnpm run build:prod

# Lint code
pnpm run lint

# Preview production build
pnpm run preview
```

### Testing the System
```bash
# Test backend API endpoints
python api_test.py

# Test frontend-backend connection
# 1. Start backend (python run.py)
# 2. Start frontend (pnpm run dev)
# 3. Visit http://localhost:3000
```

## Architecture Overview

### Backend Structure
```
backend/
├── app/
│   ├── models/          # SQLAlchemy data models (6 core tables)
│   ├── api/            # REST API endpoints (34 endpoints)
│   ├── services/       # Business logic services (6 core services)
│   └── utils/          # Response utilities and decorators
├── config.py           # Flask configuration
├── run.py             # Application entry point
└── requirements.txt   # Python dependencies
```

### Frontend Structure
```
hospital-monitor-antd/src/
├── pages/             # React page components (15+ pages)
├── components/        # Reusable UI components
├── services/          # API service layer
├── store/            # Zustand state management
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

### Core Data Models
- **Region**: Administrative divisions (4-level hierarchy: province → city → district → county)
- **Hospital**: Hospital information with website verification and scoring
- **TenderRecord**: Tender/bidding records with content deduplication
- **HospitalAlias**: Hospital name aliases for improved search
- **ScanHistory**: Crawler task execution logs and statistics
- **Settings**: Dynamic system configuration and crawler parameters

### Key Services
1. **HospitalSearchService**: Multi-channel hospital discovery via search engines and official directories
2. **TenderExtractor**: AI-powered tender information extraction using keyword patterns
3. **ContentDeduplicator**: 3-layer deduplication (SHA256 + Bloom filter + cosine similarity)
4. **CrawlerManager**: Multi-threaded crawling task management with rate limiting
5. **TaskScheduler**: APScheduler-based automated monitoring with configurable intervals
6. **CrawlerService**: Base web crawling engine with respect for robots.txt

## Key Features

### Hospital Information Management
- Automatic hospital website discovery and verification
- Multi-dimensional scoring algorithm for authenticity (100-point scale)
- Support for batch operations and data import/export via Excel
- Real-time scanning status monitoring with progress tracking

### Tender Monitoring
- Automated tender information extraction from hospital websites
- Intelligent content classification and duplicate detection
- Multi-criteria filtering and search capabilities
- Excel export functionality with customizable fields

### Admin Controls
- Crawler start/stop controls with real-time status monitoring
- Configurable scanning intervals and concurrency limits
- Comprehensive error handling and retry mechanisms
- Scheduled task management (every 6 hours for tenders, 24 hours for hospitals)

## API Endpoints

### Hospital Management
- `GET /api/v1/hospitals` - List hospitals with pagination and filtering
- `GET /api/v1/hospitals/{id}` - Get hospital details
- `POST /api/v1/hospitals` - Create new hospital
- `PUT /api/v1/hospitals/{id}` - Update hospital information
- `DELETE /api/v1/hospitals/{id}` - Delete hospital
- `POST /api/v1/hospitals/batch_import` - Batch import hospitals

### Tender Data
- `GET /api/v1/tenders` - Get tender records with filtering
- `GET /api/v1/tenders/{id}` - Get tender details
- `POST /api/v1/tenders/export` - Export data to Excel

### Crawler Control
- `POST /api/v1/crawler/start` - Start crawling tasks
- `POST /api/v1/crawler/stop` - Stop crawling tasks
- `GET /api/v1/crawler/status` - Get crawler status
- `GET /api/v1/crawler/logs` - Get crawling logs

### Regional Data
- `GET /api/v1/regions` - Get administrative region tree structure
- `GET /api/v1/regions/{id}/hospitals` - Get hospitals in specific region

### Statistics and Monitoring
- `GET /api/v1/statistics/dashboard` - Dashboard statistics
- `GET /api/v1/statistics/hospitals` - Hospital statistics
- `GET /api/v1/statistics/tenders` - Tender statistics
- `GET /api/v1/statistics/timeseries` - Time series data

## Development Notes

### Database Configuration
- Development uses SQLite (`hospital_monitor_dev.db`)
- Production supports PostgreSQL via `psycopg2-binary`
- Database auto-initializes with 34 provincial regions on first run
- Includes proper foreign key constraints and indexes

### Crawler Compliance
- Respects `robots.txt` files and crawl-delay directives
- Implements rate limiting (2-5 second delays between requests)
- Uses rotating User-Agent pool (50+ real browser agents)
- Limited to 5 concurrent threads per hospital to avoid overload
- 6-hour recommended scanning interval to avoid being blocked

### Content Deduplication Strategy
- **Primary**: SHA256 `content_hash` for exact duplicate detection
- **Secondary**: Bloom filter (1M capacity) for fast duplicate screening
- **Tertiary**: Cosine similarity (0.85 threshold) for near-duplicate detection

### Frontend State Management
- Uses Zustand for lightweight state management
- Implements real-time data updates via configurable polling
- Features responsive design with Ant Design components
- Includes comprehensive loading states and error handling

## Performance and Monitoring

### Performance Metrics
- API response times < 2 seconds
- Page load times < 3 seconds
- Database queries optimized with proper indexes
- Lazy loading for large datasets and regional trees

### Monitoring Features
- Real-time crawler status dashboard
- Scan history and success rate tracking
- Error monitoring and alerting
- Resource usage monitoring

## Testing and Quality Assurance

### Backend Testing
```bash
# Run unit tests
pytest

# Run tests with coverage
pytest --cov=app

# Run specific test modules
pytest tests/test_api.py
pytest tests/test_services.py
```

### API Testing
Use the provided `api_test.py` script to verify:
- Backend connectivity and health check
- Hospital data retrieval with pagination
- Tender data access and filtering
- Regional administrative data structure
- Crawler functionality and status
- System configuration and settings

### Frontend Testing
Manual testing checklist:
- Hospital listing and search functionality
- Tender data display and filtering
- Regional tree navigation with lazy loading
- Crawler dashboard controls and real-time updates
- Data export operations (Excel format)
- Responsive design on different screen sizes

## Deployment Considerations

### Production Environment
- Use Gunicorn WSGI server for Flask backend (recommended: 4-8 workers)
- Configure PostgreSQL for production database with proper connection pooling
- Set up reverse proxy with Nginx for static file serving
- Consider Redis for caching and Celery for task queues
- Implement proper logging with log rotation

### Security Considerations
- CORS properly configured for frontend domain
- SQL injection protection via SQLAlchemy ORM
- Rate limiting on API endpoints to prevent abuse
- Input validation and sanitization throughout the application
- HTTPS enforcement in production environment

### Performance Optimization
- Database indexes optimized for query patterns
- Pagination for large data sets (default 20 items per page)
- Concurrent request limiting for crawler operations
- Frontend code splitting and lazy loading
- Image optimization and CDN usage for static assets

## Troubleshooting

### Common Issues
1. **Backend won't start**: Check Python dependencies, database permissions, and port availability
2. **Frontend API errors**: Verify backend is running on port 5000 and CORS is configured
3. **Empty database**: Run `python run.py --init-db` to reinitialize database with seed data
4. **Crawler failures**: Check network connectivity, rate limiting settings, and robots.txt compliance
5. **Memory issues**: Monitor crawler thread count and implement proper resource cleanup

### Debug Mode
Enable Flask debug mode by setting `FLASK_CONFIG=development` environment variable or modify `config.py` for development settings.

### Logging
- Application logs stored in `backend/logs/` directory
- Crawler operation logs include detailed scan history
- Error logs capture exceptions with stack traces
- Use structlog for structured logging with JSON output

This system is production-ready and has completed both frontend and backend core development as of November 18, 2025.