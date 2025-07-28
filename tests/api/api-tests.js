/**
 * API Testing Suite for ReelTracker
 * Tests error handling, rate limiting, and API reliability
 */

const request = require('supertest');
const { performance } = require('perf_hooks');

// Mock Express app for testing (will be replaced with actual app)
const createTestApp = () => {
  const express = require('express');
  const app = express();
  app.use(express.json());
  
  // Mock endpoints for testing structure
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/api/movies', (req, res) => res.json({ movies: [] }));
  app.get('/api/movies/:id', (req, res) => res.json({ id: req.params.id }));
  app.post('/api/movies', (req, res) => res.status(201).json({ id: 1, ...req.body }));
  app.put('/api/movies/:id', (req, res) => res.json({ id: req.params.id, ...req.body }));
  app.delete('/api/movies/:id', (req, res) => res.status(204).send());
  
  return app;
};

describe('API Functionality Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  /**
   * Health check endpoint
   */
  describe('Health Check', () => {
    test('GET /api/health returns 200 with status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });
  });

  /**
   * Movies API endpoints
   */
  describe('Movies API', () => {
    test('GET /api/movies returns movies list', async () => {
      const response = await request(app)
        .get('/api/movies')
        .expect(200);

      expect(response.body).toHaveProperty('movies');
      expect(Array.isArray(response.body.movies)).toBe(true);
    });

    test('GET /api/movies/:id returns specific movie', async () => {
      const movieId = '123';
      const response = await request(app)
        .get(`/api/movies/${movieId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(movieId);
    });

    test('POST /api/movies creates new movie', async () => {
      const newMovie = {
        title: 'Test Movie',
        year: 2023,
        genre: 'Action'
      };

      const response = await request(app)
        .post('/api/movies')
        .send(newMovie)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newMovie.title);
    });

    test('PUT /api/movies/:id updates existing movie', async () => {
      const movieId = '123';
      const updatedMovie = {
        title: 'Updated Movie',
        year: 2024
      };

      const response = await request(app)
        .put(`/api/movies/${movieId}`)
        .send(updatedMovie)
        .expect(200);

      expect(response.body.id).toBe(movieId);
      expect(response.body.title).toBe(updatedMovie.title);
    });

    test('DELETE /api/movies/:id removes movie', async () => {
      const movieId = '123';
      await request(app)
        .delete(`/api/movies/${movieId}`)
        .expect(204);
    });
  });
});

describe('API Error Handling Tests', () => {
  let app;

  beforeAll(() => {
    const express = require('express');
    app = express();
    app.use(express.json());

    // Mock error scenarios
    app.get('/api/movies/404', (req, res) => {
      res.status(404).json({ 
        error: 'Movie not found',
        message: 'The requested movie does not exist',
        code: 'MOVIE_NOT_FOUND'
      });
    });

    app.get('/api/movies/500', (req, res) => {
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR'
      });
    });

    app.post('/api/movies/validation', (req, res) => {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Required fields are missing',
        code: 'VALIDATION_ERROR',
        details: [
          { field: 'title', message: 'Title is required' },
          { field: 'year', message: 'Year must be a valid number' }
        ]
      });
    });

    app.get('/api/unauthorized', (req, res) => {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    });

    app.get('/api/forbidden', (req, res) => {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    });
  });

  test('404 errors return proper structure', async () => {
    const response = await request(app)
      .get('/api/movies/404')
      .expect(404);

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('code');
    expect(response.body.code).toBe('MOVIE_NOT_FOUND');
  });

  test('500 errors return proper structure', async () => {
    const response = await request(app)
      .get('/api/movies/500')
      .expect(500);

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('message');
    expect(response.body.code).toBe('INTERNAL_ERROR');
  });

  test('Validation errors include field details', async () => {
    const response = await request(app)
      .post('/api/movies/validation')
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('details');
    expect(Array.isArray(response.body.details)).toBe(true);
    expect(response.body.details[0]).toHaveProperty('field');
    expect(response.body.details[0]).toHaveProperty('message');
  });

  test('Authentication errors return 401', async () => {
    const response = await request(app)
      .get('/api/unauthorized')
      .expect(401);

    expect(response.body.code).toBe('AUTH_REQUIRED');
  });

  test('Authorization errors return 403', async () => {
    const response = await request(app)
      .get('/api/forbidden')
      .expect(403);

    expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
  });
});

describe('API Performance Tests', () => {
  let app;

  beforeAll(() => {
    const express = require('express');
    app = express();

    // Mock endpoints with simulated delays
    app.get('/api/fast', (req, res) => {
      setTimeout(() => res.json({ data: 'fast response' }), 50);
    });

    app.get('/api/slow', (req, res) => {
      setTimeout(() => res.json({ data: 'slow response' }), 2000);
    });

    app.get('/api/cached', (req, res) => {
      res.set('Cache-Control', 'public, max-age=3600');
      res.json({ data: 'cached response', timestamp: Date.now() });
    });
  });

  test('Fast endpoints respond within 500ms', async () => {
    const startTime = performance.now();
    await request(app)
      .get('/api/fast')
      .expect(200);
    const endTime = performance.now();

    const responseTime = endTime - startTime;
    expect(responseTime).toBeLessThan(500);
  });

  test('Slow endpoints are identified', async () => {
    const startTime = performance.now();
    await request(app)
      .get('/api/slow')
      .expect(200);
    const endTime = performance.now();

    const responseTime = endTime - startTime;
    // Document slow endpoints for optimization
    if (responseTime > 1000) {
      console.warn(`Slow endpoint detected: /api/slow took ${responseTime}ms`);
    }
  });

  test('Cached responses include proper headers', async () => {
    const response = await request(app)
      .get('/api/cached')
      .expect(200);

    expect(response.headers['cache-control']).toContain('public');
    expect(response.headers['cache-control']).toContain('max-age');
  });
});

describe('Rate Limiting Tests', () => {
  let app;

  beforeAll(() => {
    const express = require('express');
    const rateLimit = require('express-rate-limit');
    
    app = express();

    // Mock rate limiter (5 requests per minute for testing)
    const limiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 5, // 5 requests per window
      message: {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false
    });

    app.use('/api/limited', limiter);
    app.get('/api/limited/test', (req, res) => {
      res.json({ message: 'Request successful' });
    });
  });

  test('Rate limiting blocks excessive requests', async () => {
    // Make 5 successful requests
    for (let i = 0; i < 5; i++) {
      await request(app)
        .get('/api/limited/test')
        .expect(200);
    }

    // 6th request should be rate limited
    const response = await request(app)
      .get('/api/limited/test')
      .expect(429);

    expect(response.body).toHaveProperty('error');
    expect(response.body.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  test('Rate limit headers are present', async () => {
    const response = await request(app)
      .get('/api/limited/test')
      .expect(200);

    expect(response.headers).toHaveProperty('ratelimit-limit');
    expect(response.headers).toHaveProperty('ratelimit-remaining');
    expect(response.headers).toHaveProperty('ratelimit-reset');
  });
});

describe('API Security Tests', () => {
  let app;

  beforeAll(() => {
    const express = require('express');
    app = express();
    app.use(express.json());

    // Mock security middleware
    app.use((req, res, next) => {
      // Basic security headers
      res.set('X-Content-Type-Options', 'nosniff');
      res.set('X-Frame-Options', 'DENY');
      res.set('X-XSS-Protection', '1; mode=block');
      next();
    });

    app.get('/api/secure', (req, res) => {
      res.json({ message: 'Secure endpoint' });
    });

    app.post('/api/input', (req, res) => {
      // Mock input validation
      const { userInput } = req.body;
      if (userInput && userInput.includes('<script>')) {
        return res.status(400).json({
          error: 'Invalid input',
          message: 'Potentially malicious content detected',
          code: 'INVALID_INPUT'
        });
      }
      res.json({ received: userInput });
    });
  });

  test('Security headers are present', async () => {
    const response = await request(app)
      .get('/api/secure')
      .expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['x-xss-protection']).toBe('1; mode=block');
  });

  test('XSS attempts are blocked', async () => {
    const maliciousInput = '<script>alert("xss")</script>';
    
    const response = await request(app)
      .post('/api/input')
      .send({ userInput: maliciousInput })
      .expect(400);

    expect(response.body.code).toBe('INVALID_INPUT');
  });

  test('SQL injection patterns are detected', async () => {
    const sqlInjection = "'; DROP TABLE users; --";
    
    const response = await request(app)
      .post('/api/input')
      .send({ userInput: sqlInjection })
      .expect(400);

    expect(response.body.code).toBe('INVALID_INPUT');
  });
});

/**
 * Load testing configuration for Artillery
 */
const loadTestConfig = {
  config: {
    target: 'http://localhost:3000',
    phases: [
      { duration: 60, arrivalRate: 10 }, // Warm up
      { duration: 120, arrivalRate: 50 }, // Normal load
      { duration: 60, arrivalRate: 100 }, // Peak load
      { duration: 60, arrivalRate: 200 }  // Stress test
    ]
  },
  scenarios: [
    {
      name: 'Browse movies',
      weight: 70,
      flow: [
        { get: { url: '/api/movies' } },
        { think: 3 },
        { get: { url: '/api/movies/{{ $randomInt(1, 1000) }}' } }
      ]
    },
    {
      name: 'Search movies',
      weight: 20,
      flow: [
        { get: { url: '/api/search?q={{ $randomString() }}' } },
        { think: 2 }
      ]
    },
    {
      name: 'Create review',
      weight: 10,
      flow: [
        { 
          post: { 
            url: '/api/movies/{{ $randomInt(1, 100) }}/reviews',
            json: {
              rating: '{{ $randomInt(1, 5) }}',
              comment: 'Test review {{ $randomString() }}'
            }
          }
        }
      ]
    }
  ]
};

module.exports = { loadTestConfig };