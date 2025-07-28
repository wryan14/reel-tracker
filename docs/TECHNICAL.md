# ReelTracker Technical Documentation

## Architecture Overview

ReelTracker is a Flask-based web application designed for personal movie tracking with a focus on simplicity, performance, and offline capability.

### System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Browser   │ ── │  Flask App       │ ── │ SQLite Database │
│                 │    │  (app.py)        │    │ (reeltracker.db)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         │                        │                       │
         └────── Static Assets ───┼─── TMDB API ─────────┘
              (CSS/JS/Images)         (api_service.py)
```

### Core Components

#### 1. Flask Application (`app.py`)
- **Purpose**: Main application entry point and route handling
- **Key Features**:
  - RESTful API endpoints for movie operations
  - Template rendering with Jinja2
  - Session management and caching
  - Database connection management
  - Error handling and logging

#### 2. API Service (`api_service.py`)
- **Purpose**: TMDB API integration with rate limiting and caching
- **Key Features**:
  - Rate-limited API requests (35 requests/minute)
  - Response caching with configurable TTL
  - Fallback to mock service when API unavailable
  - Genre mapping and movie enrichment
  - Poster URL generation

#### 3. Data Visualizations (`data_visualizations.py`)
- **Purpose**: Generate chart data for statistics dashboard
- **Key Features**:
  - Rating distribution calculations
  - Genre breakdown analysis
  - Viewing timeline data
  - Monthly statistics aggregation
  - Chart.js compatible data formatting

#### 4. Time Series Service (`time_series_service.py`)
- **Purpose**: Advanced analytics and viewing pattern analysis
- **Key Features**:
  - Extended timeline analysis (daily, weekly, monthly)
  - Viewing streak calculations
  - Habit consistency scoring
  - Genre evolution tracking
  - Peak viewing time analysis

### Database Schema

#### Tables Structure

```sql
-- Core movie information
CREATE TABLE movies (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    year INTEGER,
    director TEXT,
    genre TEXT,
    plot TEXT,
    poster_url TEXT,
    imdb_id TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User's personal watchlist
CREATE TABLE watchlist (
    id INTEGER PRIMARY KEY,
    movie_id INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    priority INTEGER DEFAULT 0,
    notes TEXT,
    FOREIGN KEY (movie_id) REFERENCES movies(id),
    UNIQUE(movie_id)
);

-- User ratings and reviews
CREATE TABLE user_ratings (
    id INTEGER PRIMARY KEY,
    movie_id INTEGER NOT NULL,
    rating REAL NOT NULL CHECK(rating >= 0 AND rating <= 10),
    review TEXT,
    rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(id),
    UNIQUE(movie_id)
);

-- Viewing history tracking
CREATE TABLE viewing_history (
    id INTEGER PRIMARY KEY,
    movie_id INTEGER NOT NULL,
    watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (movie_id) REFERENCES movies(id)
);
```

#### Indexes for Performance
- `idx_movies_title` - Optimizes movie title searches
- `idx_movies_year` - Speeds up year-based filtering
- `idx_watchlist_priority` - Optimizes watchlist priority ordering
- `idx_ratings_rating` - Accelerates rating-based queries

### API Endpoints

#### Core Application Routes

| Method | Endpoint | Purpose | Parameters |
|--------|----------|---------|------------|
| GET | `/` | Home page with recent activity | - |
| GET | `/search` | Movie search interface | `q` (query), `source` (api/local) |
| GET | `/movie/<id>` | Movie details page | `source` (optional) |
| GET | `/stats` | Statistics dashboard | - |
| GET | `/timeline` | Time series analysis | - |
| GET | `/watchlist` | Personal watchlist | - |

#### REST API Endpoints

| Method | Endpoint | Purpose | Request Body |
|--------|----------|---------|--------------|
| GET | `/api/stats` | JSON statistics for real-time updates | - |
| POST | `/movie/<id>/rate` | Rate a movie | `rating`, `review` |
| POST | `/movie/<id>/watched` | Mark movie as watched | `watched_date`, `notes` |
| POST | `/movie/<id>/add-watchlist` | Add to watchlist | - |
| POST | `/movie/<id>/remove-watchlist` | Remove from watchlist | - |
| POST | `/movie/<id>/save-from-api` | Save TMDB movie to local DB | - |

### Frontend Architecture

#### Technology Stack
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern styling with Grid and Flexbox
- **Vanilla JavaScript**: No framework dependencies
- **Chart.js**: Data visualization library
- **Progressive Enhancement**: Works without JavaScript

#### Key JavaScript Modules

```javascript
// Gamification system (static/js/gamification.js)
- Achievement tracking and notifications
- User level calculations
- Progress bar updates
- Real-time stat monitoring

// Real-time updates (static/js/real-time-updates.js)
- API polling for fresh statistics
- UI update coordination
- Chart refresh handling
- Achievement unlock notifications

// Chart configuration (static/js/chart-config.js)
- Chart.js setup and theming
- Responsive chart configuration
- Data formatting utilities
- Accessibility enhancements
```

### Performance Optimizations

#### Backend Optimizations
1. **Response Caching**: 
   - `@cache_response()` decorator for expensive operations
   - TTL-based cache invalidation
   - Memory-based caching for development

2. **Database Optimizations**:
   - Strategic indexes on commonly queried columns
   - Query optimization for statistics calculations
   - Connection pooling and reuse

3. **API Rate Limiting**:
   - TMDB API request throttling
   - Exponential backoff for failed requests
   - Response caching to minimize API calls

#### Frontend Optimizations
1. **Asset Optimization**:
   - Minified CSS and JavaScript
   - Efficient image loading
   - Lazy loading for non-critical content

2. **Progressive Enhancement**:
   - Core functionality works without JavaScript
   - Enhanced features layer on top
   - Graceful degradation for older browsers

3. **Real-time Updates**:
   - Efficient polling strategies
   - Batched DOM updates
   - Optimistic UI updates

### Configuration Management

#### Environment Variables
```env
# Database Configuration
DATABASE=reeltracker.db

# TMDB API Configuration (Optional)
TMDB_API_KEY=your_api_key_here
TMDB_ACCESS_TOKEN=your_access_token_here

# Flask Configuration
SECRET_KEY=your-secret-key-for-sessions
FLASK_ENV=development
FLASK_DEBUG=True
```

#### Feature Flags
The application gracefully handles missing dependencies:
- TMDB API unavailable → Mock service activated
- Chart.js not loaded → Fallback to text-based stats
- JavaScript disabled → Core functionality still works

### Testing Strategy

#### Test Categories
1. **Unit Tests** (`tests/`)
   - Individual function testing
   - Database operation validation
   - API service mocking

2. **Integration Tests**
   - End-to-end workflow testing
   - Database schema validation
   - API integration testing

3. **Performance Tests**
   - Response time benchmarking
   - Memory usage profiling
   - Concurrent user simulation

4. **Accessibility Tests**
   - WCAG compliance validation
   - Screen reader compatibility
   - Keyboard navigation testing

#### Running Tests
```bash
# All tests
python -m pytest tests/ -v

# Specific categories
python -m pytest tests/api/ -v
python -m pytest tests/database/ -v
python -m pytest tests/performance/ -v
python -m pytest tests/accessibility/ -v

# Coverage report
python -m pytest --cov=. --cov-report=html
```

### Deployment

#### Local Development
```bash
# Setup
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

# Run
python app.py
```

#### Production Considerations
1. **Security**:
   - Change default secret key
   - Use HTTPS in production
   - Regular dependency updates
   - Input validation and sanitization

2. **Performance**:
   - Use production WSGI server (Gunicorn)
   - Configure proper caching headers
   - Database backup strategy
   - Monitor resource usage

3. **Monitoring**:
   - Application logging
   - Error tracking
   - Performance monitoring
   - Database integrity checks

### Troubleshooting

#### Common Issues

**Database Issues**:
```bash
# Reset database
rm reeltracker.db
python app.py  # Will recreate schema
```

**TMDB API Issues**:
```bash
# Check API key
curl "https://api.themoviedb.org/3/movie/550?api_key=YOUR_KEY"

# Verify environment variables
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('TMDB_API_KEY'))"
```

**Performance Issues**:
```bash
# Clear cache
# Restart application

# Check database size
sqlite3 reeltracker.db "SELECT COUNT(*) FROM movies;"

# Analyze slow queries
sqlite3 reeltracker.db ".timer on" "SELECT * FROM viewing_history LIMIT 100;"
```

#### Debug Mode
Enable Flask debug mode in `.env`:
```env
FLASK_ENV=development
FLASK_DEBUG=True
```

This enables:
- Detailed error pages
- Automatic reloading
- Debug toolbar
- Extended logging

### Security Considerations

#### Input Validation
- SQL injection prevention through parameterized queries
- XSS prevention through template escaping
- CSRF protection via Flask-WTF (if implemented)
- Input sanitization for all user data

#### Data Protection
- Local-only data storage (no cloud dependencies)
- Optional API key usage
- No user tracking or analytics
- Secure session management

### Future Enhancements

#### Planned Features
1. **Advanced Analytics**:
   - Machine learning recommendations
   - Viewing pattern predictions
   - Social features (optional)

2. **Performance Improvements**:
   - Redis caching layer
   - Database query optimization
   - CDN integration for static assets

3. **User Experience**:
   - Mobile app (PWA)
   - Offline synchronization
   - Advanced search filters
   - Bulk operations

#### Technical Debt
- Refactor large functions in `app.py`
- Add comprehensive error handling
- Implement proper logging system
- Add API rate limiting middleware

---

For questions about implementation details or architectural decisions, please refer to the inline code comments or create an issue in the repository.