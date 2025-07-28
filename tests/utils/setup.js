/**
 * Test Setup and Utilities for MovieHive Test Suite
 * Global test configuration and helper functions
 */

const { performance } = require('perf_hooks');

// Global test configuration
global.TEST_CONFIG = {
  BASE_URL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  API_BASE_URL: process.env.TEST_API_URL || 'http://localhost:3000/api',
  TIMEOUT: 30000,
  PERFORMANCE_THRESHOLDS: {
    PAGE_LOAD: 3000,
    API_RESPONSE: 500,
    LCP: 2500,
    FCP: 1800,
    CLS: 0.1
  }
};

// Global test helpers
global.testHelpers = {
  /**
   * Wait for a condition to be true
   */
  waitFor: async (condition, timeout = 5000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  },

  /**
   * Measure execution time of a function
   */
  measureTime: async (fn) => {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    return {
      result,
      duration: endTime - startTime
    };
  },

  /**
   * Generate test data
   */
  generateTestData: {
    movie: (overrides = {}) => ({
      title: 'Test Movie',
      year: 2023,
      genre: 'Action',
      rating: 8.5,
      description: 'A test movie for automated testing',
      ...overrides
    }),

    user: (overrides = {}) => ({
      username: `testuser_${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      passwordHash: 'hashedpassword123',
      ...overrides
    }),

    review: (overrides = {}) => ({
      rating: 4,
      comment: 'Great movie! Highly recommended.',
      ...overrides
    })
  },

  /**
   * Mock API responses
   */
  mockApiResponse: (data, status = 200, delay = 0) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          status,
          ok: status >= 200 && status < 300,
          json: () => Promise.resolve(data),
          text: () => Promise.resolve(JSON.stringify(data))
        });
      }, delay);
    });
  },

  /**
   * Create test database
   */
  createTestDatabase: async () => {
    const { Sequelize } = require('sequelize');
    const sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false
    });

    // Define models (simplified for testing)
    const Movie = sequelize.define('Movie', {
      title: { type: require('sequelize').DataTypes.STRING, allowNull: false },
      year: { type: require('sequelize').DataTypes.INTEGER, allowNull: false },
      genre: { type: require('sequelize').DataTypes.STRING, allowNull: false },
      rating: { type: require('sequelize').DataTypes.DECIMAL(3, 2) }
    });

    const User = sequelize.define('User', {
      username: { type: require('sequelize').DataTypes.STRING, allowNull: false, unique: true },
      email: { type: require('sequelize').DataTypes.STRING, allowNull: false, unique: true },
      passwordHash: { type: require('sequelize').DataTypes.STRING, allowNull: false }
    });

    const Review = sequelize.define('Review', {
      rating: { type: require('sequelize').DataTypes.INTEGER, allowNull: false },
      comment: { type: require('sequelize').DataTypes.TEXT }
    });

    // Define associations
    User.hasMany(Review);
    Review.belongsTo(User);
    Movie.hasMany(Review);
    Review.belongsTo(Movie);

    await sequelize.sync();

    return { sequelize, Movie, User, Review };
  }
};

// Global accessibility testing helpers
global.accessibilityHelpers = {
  /**
   * Check color contrast ratio
   */
  checkColorContrast: (foreground, background) => {
    // Simple contrast ratio calculation
    const getLuminance = (color) => {
      const rgb = color.match(/\d+/g).map(Number);
      const [r, g, b] = rgb.map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    
    return {
      ratio: contrast,
      passAA: contrast >= 4.5,
      passAAA: contrast >= 7
    };
  },

  /**
   * Check if element is keyboard accessible
   */
  isKeyboardAccessible: async (page, selector) => {
    return await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return false;
      
      const tabIndex = element.tabIndex;
      const isInteractive = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName);
      const hasTabIndex = tabIndex >= 0;
      const hasClickHandler = element.onclick !== null;
      
      return isInteractive || hasTabIndex || hasClickHandler;
    }, selector);
  }
};

// Global performance testing helpers
global.performanceHelpers = {
  /**
   * Measure Web Vitals
   */
  measureWebVitals: async (page) => {
    return await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals = {};
        let resolved = false;

        const resolveIfComplete = () => {
          if (!resolved && vitals.lcp && vitals.fcp && vitals.cls !== undefined) {
            resolved = true;
            resolve(vitals);
          }
        };

        // LCP
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          vitals.lcp = entries[entries.length - 1].startTime;
          resolveIfComplete();
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // FCP
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
          vitals.fcp = fcpEntry ? fcpEntry.startTime : 0;
          resolveIfComplete();
        }).observe({ entryTypes: ['paint'] });

        // CLS
        let cls = 0;
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          }
          vitals.cls = cls;
          resolveIfComplete();
        }).observe({ entryTypes: ['layout-shift'] });

        // Timeout fallback
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(vitals);
          }
        }, 5000);
      });
    });
  },

  /**
   * Monitor resource loading
   */
  monitorResourceLoading: async (page) => {
    const resources = [];
    
    page.on('response', response => {
      resources.push({
        url: response.url(),
        status: response.status(),
        contentType: response.headers()['content-type'],
        size: response.headers()['content-length'],
        fromCache: response.fromCache(),
        timing: response.timing()
      });
    });

    return resources;
  }
};

// Jest custom matchers
expect.extend({
  toBeAccessible(received) {
    const pass = received.violations.length === 0;
    return {
      message: () => pass
        ? `Expected accessibility violations but found none`
        : `Expected no accessibility violations but found ${received.violations.length}:\n${
            received.violations.map(v => `- ${v.id}: ${v.description}`).join('\n')
          }`,
      pass
    };
  },

  toMeetPerformanceStandard(received, threshold) {
    const pass = received <= threshold;
    return {
      message: () => pass
        ? `Expected ${received} to exceed ${threshold} but it met the standard`
        : `Expected ${received} to be <= ${threshold} but it exceeded the threshold`,
      pass
    };
  },

  toHaveGoodColorContrast(received) {
    const contrast = global.accessibilityHelpers.checkColorContrast(
      received.foreground, 
      received.background
    );
    const pass = contrast.passAA;
    return {
      message: () => pass
        ? `Expected poor color contrast but ratio ${contrast.ratio.toFixed(2)} passes AA standards`
        : `Expected color contrast ratio >= 4.5 but got ${contrast.ratio.toFixed(2)}`,
      pass
    };
  }
});

// Global test cleanup
afterEach(() => {
  // Clean up any global state
  jest.clearAllTimers();
});

// Error handling for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('MovieHive test suite initialized with accessibility and performance helpers');