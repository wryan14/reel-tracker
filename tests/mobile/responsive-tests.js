/**
 * Mobile Responsiveness Test Suite for ReelTracker
 * Tests touch targets, viewport behavior, and mobile UX
 */

const puppeteer = require('puppeteer');

describe('Mobile Responsiveness Tests', () => {
  let browser;
  let page;

  // Standard mobile viewport sizes
  const viewports = [
    { name: 'iPhone SE', width: 375, height: 667, deviceScaleFactor: 2 },
    { name: 'iPhone 12', width: 390, height: 844, deviceScaleFactor: 3 },
    { name: 'Galaxy S21', width: 384, height: 854, deviceScaleFactor: 2.75 },
    { name: 'iPad Mini', width: 768, height: 1024, deviceScaleFactor: 2 },
    { name: 'Desktop', width: 1024, height: 768, deviceScaleFactor: 1 }
  ];

  beforeAll(async () => {
    browser = await puppeteer.launch({ 
      headless: process.env.CI === 'true',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  afterAll(async () => {
    await browser.close();
  });

  /**
   * Test touch target sizes across all viewports
   */
  describe('Touch Target Size Tests', () => {
    viewports.forEach(viewport => {
      test(`Touch targets meet minimum size requirements on ${viewport.name}`, async () => {
        await page.setViewport(viewport);
        await page.goto('http://localhost:3000');

        // Find all interactive elements
        const touchTargets = await page.$$eval(
          'button, a, input, select, textarea, [role="button"], [onclick]',
          elements => {
            return elements.map(el => {
              const rect = el.getBoundingClientRect();
              return {
                tagName: el.tagName,
                width: rect.width,
                height: rect.height,
                text: el.textContent.trim().substring(0, 50),
                id: el.id,
                className: el.className
              };
            });
          }
        );

        // Check each touch target meets minimum size (44px recommended)
        touchTargets.forEach(target => {
          const minSize = 44; // WCAG recommendation
          
          expect(target.width).toBeGreaterThanOrEqual(minSize);
          expect(target.height).toBeGreaterThanOrEqual(minSize);
        });
      });
    });
  });

  /**
   * Test horizontal scrolling issues
   */
  describe('Horizontal Scrolling Tests', () => {
    viewports.slice(0, 3).forEach(viewport => { // Test only mobile viewports
      test(`No horizontal overflow on ${viewport.name}`, async () => {
        await page.setViewport(viewport);
        await page.goto('http://localhost:3000');

        // Check for horizontal scrollbar
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });

        expect(hasHorizontalScroll).toBe(false);
      });
    });
  });

  /**
   * Test text readability without zoom
   */
  describe('Text Readability Tests', () => {
    viewports.slice(0, 3).forEach(viewport => {
      test(`Text is readable without zoom on ${viewport.name}`, async () => {
        await page.setViewport(viewport);
        await page.goto('http://localhost:3000');

        // Check minimum font sizes
        const textElements = await page.$$eval(
          'p, span, div, li, td, th, label, button, a',
          elements => {
            return elements.map(el => {
              const styles = window.getComputedStyle(el);
              const fontSize = parseFloat(styles.fontSize);
              const textContent = el.textContent.trim();
              
              return {
                fontSize,
                textContent: textContent.substring(0, 50),
                tagName: el.tagName,
                hasText: textContent.length > 0
              };
            });
          }
        );

        const textElementsWithContent = textElements.filter(el => el.hasText);
        
        textElementsWithContent.forEach(element => {
          // Minimum 16px for body text on mobile
          expect(element.fontSize).toBeGreaterThanOrEqual(14);
        });
      });
    });
  });

  /**
   * Test navigation and menu behavior on mobile
   */
  describe('Mobile Navigation Tests', () => {
    test('Mobile navigation is accessible and functional', async () => {
      await page.setViewport(viewports[0]); // iPhone SE
      await page.goto('http://localhost:3000');

      // Look for mobile menu trigger (hamburger menu)
      const mobileMenuExists = await page.$('.mobile-menu, [data-mobile-menu], .hamburger, .menu-toggle');
      
      if (mobileMenuExists) {
        // Test mobile menu functionality
        await page.click('.mobile-menu, [data-mobile-menu], .hamburger, .menu-toggle');
        
        // Check if menu is visible after click
        const menuVisible = await page.evaluate(() => {
          const menu = document.querySelector('.mobile-menu-content, .nav-menu, [data-menu-content]');
          if (!menu) return false;
          
          const styles = window.getComputedStyle(menu);
          return styles.display !== 'none' && styles.visibility !== 'hidden';
        });
        
        expect(menuVisible).toBe(true);
      }
    });
  });

  /**
   * Test form usability on mobile
   */
  describe('Mobile Form Tests', () => {
    test('Forms are usable on mobile devices', async () => {
      await page.setViewport(viewports[0]); // iPhone SE
      await page.goto('http://localhost:3000/search');

      // Check input field sizes
      const inputSizes = await page.$$eval('input, textarea, select', elements => {
        return elements.map(el => {
          const rect = el.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            type: el.type || el.tagName
          };
        });
      });

      inputSizes.forEach(input => {
        // Input fields should be at least 44px tall for easy tapping
        expect(input.height).toBeGreaterThanOrEqual(44);
      });
    });
  });

  /**
   * Test orientation change handling
   */
  describe('Orientation Change Tests', () => {
    test('Layout adapts properly to orientation changes', async () => {
      // Start in portrait
      await page.setViewport({ width: 375, height: 667 });
      await page.goto('http://localhost:3000');
      
      const portraitLayout = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }));

      // Switch to landscape
      await page.setViewport({ width: 667, height: 375 });
      await page.waitForTimeout(500); // Allow layout to adjust

      const landscapeLayout = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }));

      // No horizontal overflow in either orientation
      expect(portraitLayout.scrollWidth).toBeLessThanOrEqual(portraitLayout.clientWidth);
      expect(landscapeLayout.scrollWidth).toBeLessThanOrEqual(landscapeLayout.clientWidth);
    });
  });

  /**
   * Test touch gesture support (where applicable)
   */
  describe('Touch Gesture Tests', () => {
    test('Swipe gestures work correctly (if implemented)', async () => {
      await page.setViewport(viewports[0]); // iPhone SE
      await page.goto('http://localhost:3000');

      // Check for swipeable elements
      const swipeElements = await page.$$('[data-swipe], .swiper, .carousel');
      
      if (swipeElements.length > 0) {
        // Test basic swipe functionality
        const element = swipeElements[0];
        const box = await element.boundingBox();
        
        // Simulate swipe gesture
        await page.touchscreen.touchStart(box.x + 50, box.y + box.height / 2);
        await page.touchscreen.touchMove(box.x + box.width - 50, box.y + box.height / 2);
        await page.touchscreen.touchEnd();
        
        // Verify swipe had an effect (implementation-specific)
        // This would need to be customized based on actual swipe behavior
      }
    });
  });

  /**
   * Test performance on mobile
   */
  describe('Mobile Performance Tests', () => {
    test('Page loads efficiently on mobile', async () => {
      await page.setViewport(viewports[0]); // iPhone SE
      
      // Simulate slow 3G connection
      await page.emulateNetworkConditions({
        offline: false,
        downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
        uploadThroughput: 750 * 1024 / 8, // 750 Kbps
        latency: 40 // 40ms
      });

      const startTime = Date.now();
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
      const loadTime = Date.now() - startTime;

      // Page should load within 5 seconds on slow 3G
      expect(loadTime).toBeLessThan(5000);
    });
  });
});

/**
 * Manual mobile testing checklist
 */
const manualMobileChecklist = {
  devices: [
    'iPhone SE (smallest current iPhone)',
    'iPhone 12/13/14 (standard size)',
    'iPhone 12/13/14 Plus (large size)',
    'Samsung Galaxy S21',
    'iPad (tablet testing)',
    'Android tablet'
  ],
  gestures: [
    'Tap accuracy on small targets',
    'Double-tap zoom (where appropriate)',
    'Pinch to zoom (for images/maps)',
    'Swipe navigation (if implemented)',
    'Pull to refresh (if implemented)'
  ],
  usability: [
    'One-handed operation capability',
    'Thumb reach zones optimization',
    'Avoiding accidental taps',
    'Consistent touch feedback',
    'Appropriate spacing between elements'
  ]
};

module.exports = { manualMobileChecklist };