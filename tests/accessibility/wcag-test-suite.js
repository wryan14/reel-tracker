/**
 * WCAG 2.1 AA Compliance Test Suite for MovieHive
 * Automated accessibility testing using axe-core
 */

const { AxePuppeteer } = require('@axe-core/puppeteer');
const puppeteer = require('puppeteer');

describe('WCAG 2.1 AA Compliance Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ 
      headless: process.env.CI === 'true',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  beforeEach(async () => {
    page = await browser.newPage();
    // Set viewport to test responsive design
    await page.setViewport({ width: 1024, height: 768 });
  });

  afterEach(async () => {
    await page.close();
  });

  afterAll(async () => {
    await browser.close();
  });

  /**
   * Test homepage accessibility
   */
  test('Homepage meets WCAG 2.1 AA standards', async () => {
    await page.goto('http://localhost:3000');
    
    const results = await new AxePuppeteer(page)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    expect(results.violations).toHaveLength(0);
    
    // Log any violations for debugging
    if (results.violations.length > 0) {
      console.log('Accessibility violations found:', results.violations);
    }
  });

  /**
   * Test movie search page accessibility
   */
  test('Movie search page meets WCAG 2.1 AA standards', async () => {
    await page.goto('http://localhost:3000/search');
    
    const results = await new AxePuppeteer(page)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    expect(results.violations).toHaveLength(0);
  });

  /**
   * Test movie details page accessibility
   */
  test('Movie details page meets WCAG 2.1 AA standards', async () => {
    await page.goto('http://localhost:3000/movie/1');
    
    const results = await new AxePuppeteer(page)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    expect(results.violations).toHaveLength(0);
  });

  /**
   * Test keyboard navigation
   */
  test('All interactive elements are keyboard accessible', async () => {
    await page.goto('http://localhost:3000');
    
    // Test tab navigation through all interactive elements
    const interactiveElements = await page.$$eval(
      'button, a, input, select, textarea, [tabindex]',
      elements => elements.length
    );
    
    expect(interactiveElements).toBeGreaterThan(0);
    
    // Navigate through all elements with Tab key
    for (let i = 0; i < interactiveElements; i++) {
      await page.keyboard.press('Tab');
      
      // Check if focus is visible
      const focusedElement = await page.evaluate(() => {
        const focused = document.activeElement;
        const styles = window.getComputedStyle(focused);
        
        return {
          tagName: focused.tagName,
          hasOutline: styles.outline !== 'none' && styles.outline !== '',
          hasBoxShadow: styles.boxShadow !== 'none',
          hasVisibleFocus: styles.outline !== 'none' || styles.boxShadow !== 'none'
        };
      });
      
      expect(focusedElement.hasVisibleFocus).toBe(true);
    }
  });

  /**
   * Test color contrast ratios
   */
  test('Color contrast meets WCAG AA requirements', async () => {
    await page.goto('http://localhost:3000');
    
    const results = await new AxePuppeteer(page)
      .withRules(['color-contrast'])
      .analyze();
    
    expect(results.violations).toHaveLength(0);
  });

  /**
   * Test form accessibility
   */
  test('Forms have proper labels and error handling', async () => {
    await page.goto('http://localhost:3000/search');
    
    // Check for form labels
    const results = await new AxePuppeteer(page)
      .withRules(['label', 'form-field-multiple-labels'])
      .analyze();
    
    expect(results.violations).toHaveLength(0);
  });

  /**
   * Test image alternative text
   */
  test('Images have appropriate alternative text', async () => {
    await page.goto('http://localhost:3000');
    
    const results = await new AxePuppeteer(page)
      .withRules(['image-alt'])
      .analyze();
    
    expect(results.violations).toHaveLength(0);
  });

  /**
   * Test heading structure
   */
  test('Heading structure is logical and hierarchical', async () => {
    await page.goto('http://localhost:3000');
    
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', 
      elements => elements.map(el => ({
        level: parseInt(el.tagName.charAt(1)),
        text: el.textContent.trim()
      }))
    );
    
    // Check that page has exactly one H1
    const h1Count = headings.filter(h => h.level === 1).length;
    expect(h1Count).toBe(1);
    
    // Check heading hierarchy (no skipping levels)
    for (let i = 1; i < headings.length; i++) {
      const currentLevel = headings[i].level;
      const previousLevel = headings[i - 1].level;
      
      if (currentLevel > previousLevel) {
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
      }
    }
  });

  /**
   * Test ARIA implementation
   */
  test('ARIA attributes are properly implemented', async () => {
    await page.goto('http://localhost:3000');
    
    const results = await new AxePuppeteer(page)
      .withRules(['aria-valid-attr', 'aria-valid-attr-value', 'aria-roles'])
      .analyze();
    
    expect(results.violations).toHaveLength(0);
  });
});

/**
 * Manual accessibility testing checklist
 */
const manualAccessibilityChecklist = {
  screenReader: [
    'Test with NVDA (Windows)',
    'Test with JAWS (Windows)', 
    'Test with VoiceOver (macOS)',
    'Test with TalkBack (Android)',
    'Verify all content is announced',
    'Check landmark navigation',
    'Verify form instructions are clear'
  ],
  keyboard: [
    'Tab through all interactive elements',
    'Use arrow keys for menus/lists',
    'Test Escape key for dialogs',
    'Verify Enter/Space for activation',
    'Check focus indicators are visible',
    'Test skip links functionality'
  ],
  cognitive: [
    'Check for clear error messages',
    'Verify consistent navigation',
    'Test timeout warnings (if applicable)',
    'Check instructions are clear',
    'Verify content is organized logically'
  ]
};

module.exports = { manualAccessibilityChecklist };