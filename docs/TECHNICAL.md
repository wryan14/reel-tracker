# MovieHive Technical Documentation

## Architecture Overview

MovieHive is a single-file Flask application following cognitive load minimization principles. The architecture prioritizes simplicity and maintainability over premature optimization.

### System Components

- **Flask Application** (`app.py`): Core web server with integrated database operations
- **TMDB Service** (`api_service.py`): Rate-limited API integration with caching
- **Data Visualizations** (`data_visualizations.py`): Chart.js data generation
- **SQLite Database** (`moviehive.db`): Local storage for all user data
- **Static Assets**: Minimal CSS/JS following Tufte design principles

## Development Setup

### Prerequisites
- Python 3.8 or higher
- TMDB API key (optional but recommended)

### Installation
```bash
# Clone and navigate to project
cd reel-tracker

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your TMDB API key

# Initialize database (automatic on first run)
python3 app.py
```

### Development Commands
```bash
# Start development server
python3 app.py

# Run tests
cd tests && npm test

# Check database schema
sqlite3 moviehive.db ".schema"

# Reset database (WARNING: deletes all data)
rm moviehive.db && python3 app.py
```

## Database Schema

### Tables
- **movies**: Core movie metadata (title, year, director, genre, plot)
- **watchlist**: User's prioritized movie queue with notes
- **user_ratings**: Personal ratings (0-10) with optional reviews
- **viewing_history**: Track when movies were watched

### Indexes
Optimized for common queries: title search, rating lookups, date ranges

## API Integration

### TMDB Service Features
- **Rate Limiting**: 35 requests/second (conservative)
- **Caching**: 5 minutes (search), 1 hour (details), 24 hours (config)
- **Error Handling**: Graceful fallback to local database
- **Mock Service**: Development mode when API key unavailable

### Endpoints Used
- `/search/movie`: Real-time movie search
- `/movie/{id}`: Detailed movie information
- `/configuration`: Image URL generation
- `/movie/popular`: Discovery features

## Performance Optimization

### Caching Strategy
- **Application Cache**: In-memory caching with TTL
- **API Cache**: Tiered caching based on data volatility
- **Database Queries**: Indexed for common access patterns

### Response Times
- **Cached Searches**: <100ms
- **Fresh API Calls**: <500ms (TMDB SLA)
- **Local Database**: <50ms

## Security Considerations

### API Key Management
- Environment variable storage only
- No hardcoded credentials
- Rate limiting to prevent quota exhaustion

### Input Validation
- SQL injection prevention via parameterized queries
- XSS protection through template escaping
- CSRF protection via Flask-WTF (if forms added)

## Accessibility Implementation

### WCAG 2.1 AA Compliance
- **Color Contrast**: 4.5:1 minimum ratio maintained
- **Keyboard Navigation**: All interactive elements accessible
- **Screen Readers**: Semantic HTML with ARIA labels
- **Touch Targets**: 44px minimum (48px preferred)

### Testing Suite
Located in `/tests/` with automated accessibility validation:
- **axe-core integration**: Automated accessibility testing
- **Manual checklists**: WCAG compliance verification
- **Mobile testing**: Responsive design validation

## Troubleshooting

### Common Issues

**Application won't start**
```bash
# Check Python version
python3 --version  # Must be 3.8+

# Verify dependencies
pip list | grep Flask

# Check port availability
lsof -i :5000
```

**Database errors**
```bash
# Reset database
rm moviehive.db

# Check permissions
ls -la moviehive.db

# Manual schema check
sqlite3 moviehive.db ".tables"
```

**API integration failures**
```bash
# Verify API key
echo $TMDB_API_KEY

# Test API connectivity
curl "https://api.themoviedb.org/3/configuration?api_key=YOUR_KEY"

# Check rate limiting
grep "rate limit" app.log
```

### Performance Issues

**Slow responses**
- Check database file size (>100MB may need optimization)
- Monitor API cache hit rates
- Verify network connectivity for API calls

**Memory usage**
- Application cache limited to 1000 entries
- Restart application if memory exceeds 100MB

## Deployment

### Development
Application runs on `http://localhost:5000` with debug mode enabled.

### Production Considerations
- Use production WSGI server (Gunicorn, uWSGI)
- Set `FLASK_ENV=production`
- Configure proper logging
- Implement backup strategy for SQLite database
- Consider read replicas for high usage

## Testing Strategy

### Test Coverage
- **Unit Tests**: Core functionality validation
- **Integration Tests**: API service integration
- **Accessibility Tests**: WCAG compliance verification
- **Performance Tests**: Response time monitoring

### Running Tests
```bash
cd tests
npm install  # Install test dependencies
npm test     # Run full test suite
npm run accessibility  # Accessibility only
npm run performance   # Performance benchmarks
```

## Code Standards

### Python Guidelines
- **Cognitive Load Minimization**: Single file start, minimal abstractions
- **Information Density**: Compact logic with clear naming
- **Essential Functions**: No premature optimization
- **Documentation**: Minimal but complete docstrings

### Frontend Standards
- **Tufte Principles**: Maximum data-ink ratio
- **Mobile First**: Responsive design priority
- **System Fonts**: No web font dependencies
- **Progressive Enhancement**: Core functionality without JavaScript

## Monitoring

### Health Checks
- Application startup logs
- Database connection status
- API service availability
- Response time metrics

### Key Metrics
- User engagement (ratings, watchlist additions)
- API usage and cache efficiency
- Database growth and query performance
- Accessibility compliance maintenance

## Support

For technical issues:
1. Check this documentation
2. Review application logs
3. Verify environment configuration
4. Test with minimal setup
5. Contact development team with specific error messages